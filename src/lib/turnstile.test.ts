import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";

// La config serveur est simulée : la sonde ne doit JAMAIS toucher le réseau
// réel (testing.md).
describe("verifyTurnstile (F01 règle 6)", () => {
  beforeEach(() => {
    vi.stubEnv("NEON_AUTH_BASE_URL", "https://auth.exemple.sn");
    vi.stubEnv("NEON_AUTH_COOKIE_SECRET", "x".repeat(32));
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-turnstile-de-test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("renvoie true quand Cloudflare valide le jeton", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      ),
    );

    await expect(verifyTurnstile("jeton")).resolves.toBe(true);
  });

  it("renvoie false quand Cloudflare refuse le jeton", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false }), { status: 200 }),
      ),
    );

    await expect(verifyTurnstile("jeton")).resolves.toBe(false);
  });

  it("renvoie false quand Cloudflare répond en erreur", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    await expect(verifyTurnstile("jeton")).resolves.toBe(false);
  });
});
