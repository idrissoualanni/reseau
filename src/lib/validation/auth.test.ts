import { describe, expect, it } from "vitest";
import {
  resetPasswordSchema,
  safeNextPath,
  signUpSchema,
  verifyEmailSchema,
} from "./auth";

describe("safeNextPath (anti open-redirect, F02)", () => {
  it("accepte un chemin interne", () => {
    expect(safeNextPath("/projects/42")).toBe("/projects/42");
  });

  it("refuse une URL absolue et une URL protocole-relative", () => {
    expect(safeNextPath("https://evil.test")).toBe("/");
    expect(safeNextPath("//evil.test")).toBe("/");
  });

  it("retombe sur le fallback fourni quand `next` est absent", () => {
    expect(safeNextPath(undefined, "/me/profile")).toBe("/me/profile");
  });
});

describe("signUpSchema (F01)", () => {
  it("normalise l'e-mail et accepte une entrée valide", () => {
    const result = signUpSchema.safeParse({
      name: "Awa",
      email: " AWA@Exemple.SN ",
      password: "motdepasse",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("awa@exemple.sn");
    }
  });

  it("refuse un mot de passe de moins de 8 caractères", () => {
    const result = signUpSchema.safeParse({
      name: "Awa",
      email: "awa@exemple.sn",
      password: "court",
    });

    expect(result.success).toBe(false);
  });
});

describe("verifyEmailSchema (F01)", () => {
  it("refuse un code qui n'a pas exactement 6 chiffres", () => {
    expect(verifyEmailSchema.safeParse({ email: "a@b.sn", otp: "12ab" }).success).toBe(
      false,
    );
  });
});

describe("resetPasswordSchema (F02)", () => {
  it("accepte un code valide et un nouveau mot de passe", () => {
    const result = resetPasswordSchema.safeParse({
      email: "a@b.sn",
      otp: "123456",
      password: "nouveaumdp",
    });

    expect(result.success).toBe(true);
  });
});
