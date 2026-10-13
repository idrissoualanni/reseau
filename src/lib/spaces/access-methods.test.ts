import { afterEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors";
import type { SpaceAccessKind, SpaceAccessMethod } from "@/lib/types";
import { hashSecret, resolveAccessMethod, verifySecret } from "./access-methods";

function method(
  kind: SpaceAccessKind,
  config: Record<string, unknown> = {},
): SpaceAccessMethod {
  return {
    id: `am-${kind}`,
    spaceId: "sp1",
    method: kind,
    config,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("hashSecret / verifySecret (F15 sécurité)", () => {
  it("produit une empreinte SHA-256 stable en hexadécimal", () => {
    const hash = hashSecret("code-secret");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSecret("code-secret")).toBe(hash);
    expect(hashSecret("code-secret")).not.toContain("code-secret");
  });

  it("accepte le bon secret et refuse un autre", () => {
    const hash = hashSecret("bon-code");
    expect(verifySecret("bon-code", hash)).toBe(true);
    expect(verifySecret("mauvais", hash)).toBe(false);
  });

  it("refuse un hash malformé (longueur différente) sans lever", () => {
    expect(verifySecret("bon-code", "")).toBe(false);
    expect(verifySecret("bon-code", "abc")).toBe(false);
  });
});

describe("resolveAccessMethod (F15 règles 2-5)", () => {
  it("`open` : adhésion immédiate non vérifiée", () => {
    expect(resolveAccessMethod(method("open"), {})).toEqual({
      action: "join",
      verificationLevel: "unverified",
      verifiedVia: "open",
    });
  });

  it("`manual_approval` : demande en attente", () => {
    expect(resolveAccessMethod(method("manual_approval"), {})).toEqual({
      action: "request",
      verificationLevel: "unverified",
      verifiedVia: "manual_approval",
    });
  });

  it("`invite_code` : validé par le hash, appartenance vérifiée", () => {
    const config = { codeHash: hashSecret("secret-code") };
    expect(resolveAccessMethod(method("invite_code", config), { code: "secret-code" })).toEqual({
      action: "join",
      verificationLevel: "verified",
      verifiedVia: "invite_code",
    });
  });

  it("`invite_code` : refuse un code invalide (critère 2)", () => {
    const config = { codeHash: hashSecret("secret-code") };
    expect(() => resolveAccessMethod(method("invite_code", config), { code: "faux" })).toThrow(
      ValidationError,
    );
  });

  it("`invite_code` : refuse un code absent", () => {
    const config = { codeHash: hashSecret("secret-code") };
    expect(() => resolveAccessMethod(method("invite_code", config), {})).toThrow(ValidationError);
  });

  it("`invite_link` : accepte un jeton valide et non expiré (F15 règle 4)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
    const config = { tokenHash: hashSecret("jeton"), expiresAt: "2026-07-01T00:00:00.000Z" };

    expect(resolveAccessMethod(method("invite_link", config), { token: "jeton" })).toEqual({
      action: "join",
      verificationLevel: "verified",
      verifiedVia: "invite_link",
    });
  });

  it("`invite_link` : refuse un lien expiré", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
    const config = { tokenHash: hashSecret("jeton"), expiresAt: "2026-05-01T00:00:00.000Z" };

    expect(() => resolveAccessMethod(method("invite_link", config), { token: "jeton" })).toThrow(
      "Ce lien d'invitation a expiré.",
    );
  });

  it("`invite_link` : refuse un jeton invalide", () => {
    const config = { tokenHash: hashSecret("jeton"), expiresAt: "2999-01-01T00:00:00.000Z" };
    expect(() =>
      resolveAccessMethod(method("invite_link", config), { token: "faux" }),
    ).toThrow("Lien d'invitation invalide.");
  });

  it("refuse une méthode inconnue", () => {
    const unknown = { ...method("open"), method: "email_domain" } as unknown as SpaceAccessMethod;
    expect(() => resolveAccessMethod(unknown, {})).toThrow("Méthode d'accès inconnue.");
  });
});
