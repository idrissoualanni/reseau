import { NextResponse } from "next/server";
import { RateLimitedError } from "@/lib/errors";

// ─── Vérification de l'Origin (anti-CSRF) ───────────────────────────────────
// Les mutations depuis le navigateur same-origin envoient toujours un en-tête
// `Origin`. Un Origin absent est toléré (SameSite=Lax protège déjà) ; un Origin
// présent mais différent est rejeté (403).

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isSafeMethod(method: string): boolean {
  return SAFE_METHODS.has(method.toUpperCase());
}

export function originAllowed(request: Request, appUrl: string | undefined): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // pas d'Origin → SameSite=Lax protège
  if (!appUrl) return true; // pas de NEXT_PUBLIC_APP_URL → on ne peut pas vérifier
  try {
    return new URL(origin).origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}

// ─── Rate limiting en mémoire (fenêtre glissante) ────────────────────────────
// Simple, sans dépendance. Valable pour une instance unique (Render dev).
// En production multi-instances, remplacer par Redis (Render KV).

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Nettoyage périodique pour éviter la fuite mémoire
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 min
let lastCleanup = Date.now();

function cleanup(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < 60_000);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const resetAt = bucket.timestamps[0] + windowMs;
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0, resetAt };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.timestamps.length, resetAt: now + windowMs };
}

// Clé de rate limiting : IP + route (ou juste route si IP absente)
export function rateLimitKey(request: Request, route: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return `${route}:${ip}`;
}

// ─── Garde-fou combiné pour les mutations ────────────────────────────────────
// Retourne une NextResponse d'erreur (403 ou 429) ou null si tout est OK.

export function guardMutation(
  request: Request,
  route: string,
  appUrl: string | undefined,
  limit: number,
): NextResponse | null {
  if (!originAllowed(request, appUrl)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Origine non autorisée." } },
      { status: 403 },
    );
  }

  const result = rateLimit(rateLimitKey(request, route), limit);
  if (!result.allowed) {
    const error = new RateLimitedError("Trop de requêtes, réessaie dans un instant.");
    const response = NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(Math.ceil((result.resetAt - Date.now()) / 1000)));
    return response;
  }

  return null;
}
