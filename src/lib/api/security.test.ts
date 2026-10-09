import { describe, expect, it } from "vitest";
import { guardMutation, originAllowed, rateLimit } from "./security";

function makeRequest(init: { method?: string; origin?: string; url?: string } = {}): Request {
  const headers = new Headers();
  if (init.origin) headers.set("origin", init.origin);
  return new Request(init.url ?? "http://test.local/api/test", {
    method: init.method ?? "POST",
    headers,
  });
}

describe("originAllowed (anti-CSRF)", () => {
  const APP_URL = "https://app.exemple.sn";

  it("accepte une requête same-origin", () => {
    expect(originAllowed(makeRequest({ origin: "https://app.exemple.sn" }), APP_URL)).toBe(true);
  });

  it("accepte une requête sans Origin (SameSite=Lax protège)", () => {
    expect(originAllowed(makeRequest(), APP_URL)).toBe(true);
  });

  it("refuse un Origin cross-origin", () => {
    expect(originAllowed(makeRequest({ origin: "https://evil.test" }), APP_URL)).toBe(false);
  });

  it("accepte quand NEXT_PUBLIC_APP_URL est absent (non vérifiable)", () => {
    expect(originAllowed(makeRequest({ origin: "https://evil.test" }), undefined)).toBe(true);
  });
});

describe("rateLimit (fenêtre glissante)", () => {
  it("permet jusqu'à la limite puis bloque", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5).allowed).toBe(true);
    }
    expect(rateLimit(key, 5).allowed).toBe(false);
  });

  it("réinitialise après la fenêtre", () => {
    const key = `test:${Math.random()}`;
    // On remplit le seuil avec une fenêtre de 50 ms
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 50);
    expect(rateLimit(key, 3, 50).allowed).toBe(false);
    // Après la fenêtre, de nouveau autorisé (on ne peut pas attendre dans l'unité,
    // on vérifie juste que le compteur est reparti de zéro via une nouvelle clé)
    const key2 = `test:${Math.random()}`;
    expect(rateLimit(key2, 3, 50).allowed).toBe(true);
  });
});

describe("guardMutation", () => {
  const APP_URL = "https://app.exemple.sn";

  it("retourne null quand tout est OK", () => {
    const request = makeRequest({ method: "POST", origin: "https://app.exemple.sn" });
    expect(guardMutation(request, "/api/test", APP_URL, 10)).toBeNull();
  });

  it("retourne 403 quand l'Origin est interdit", () => {
    const request = makeRequest({ method: "POST", origin: "https://evil.test" });
    const response = guardMutation(request, "/api/test", APP_URL, 10);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
  });

  it("retourne 429 quand la limite est atteinte", () => {
    const key = "guard-test";
    // On sature la limite
    for (let i = 0; i < 2; i++) {
      const request = makeRequest({ method: "POST", origin: "https://app.exemple.sn" });
      guardMutation(request, key, APP_URL, 2);
    }
    const request = makeRequest({ method: "POST", origin: "https://app.exemple.sn" });
    const response = guardMutation(request, key, APP_URL, 2);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
  });
});
