import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { isUsernameAvailable } from "@/lib/profile";
import { ok, parseInput, withApi } from "@/lib/api/respond";
import { rateLimit, rateLimitKey } from "@/lib/api/security";
import { usernameQuerySchema } from "@/lib/validation/profile";

// Disponibilité d'un username pour l'onboarding (F03). Réservé aux membres
// connectés (aucune route publique hors /api/health). Rate limiting : 20/min.
export const GET = withApi(async (request: Request) => {
  await requireSession();
  const result = rateLimit(rateLimitKey(request, "/api/profiles/username-available"), 20);
  if (!result.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Trop de requêtes, réessaie dans un instant." } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) } },
    );
  }
  const url = new URL(request.url);
  const { u } = parseInput(usernameQuerySchema, { u: url.searchParams.get("u") ?? "" });
  return ok({ available: await isUsernameAvailable(u) });
});
