import { getTurnstileEnv } from "@/lib/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Vérifie le jeton Turnstile côté serveur (F01 règle 6). `false` si Cloudflare
// refuse le jeton ou répond en erreur ; lève si la configuration manque.
export async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  const { TURNSTILE_SECRET_KEY } = getTurnstileEnv();

  const body = new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(VERIFY_URL, {
    method: "POST",
    body,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  if (!response.ok) return false;

  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}
