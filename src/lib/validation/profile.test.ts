import { describe, expect, it } from "vitest";
import {
  createProfileSchema,
  RESERVED_USERNAMES,
  updateProfileSchema,
  usernameQuerySchema,
  usernameSchema,
} from "./profile";

describe("usernameSchema (F03)", () => {
  it("normalise en minuscules et accepte un nom valide", () => {
    const result = usernameSchema.safeParse("  Awa_Diop ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("awa_diop");
  });

  it("refuse un nom trop court, un caractère interdit ou un nom réservé", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("awa-diop").success).toBe(false);
    expect(usernameSchema.safeParse("admin").success).toBe(false);
  });

  it("réserve des noms qui entrent en collision avec une route", () => {
    for (const name of RESERVED_USERNAMES) {
      const result = usernameSchema.safeParse(name);
      if (name.length >= 3 && /^[a-z0-9_]+$/.test(name)) {
        expect(result.success).toBe(false);
      }
    }
  });
});

describe("createProfileSchema (F03)", () => {
  it("accepte un profil complet et convertit un champ vide en absence", () => {
    const result = createProfileSchema.safeParse({
      username: "awa_diop",
      displayName: "Awa Diop",
      bio: "  ",
      schoolName: "UCAD",
      fieldOfStudy: "Informatique",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bio).toBeUndefined();
      expect(result.data.schoolName).toBe("UCAD");
    }
  });

  it("refuse un champ inconnu (strict)", () => {
    const result = createProfileSchema.safeParse({
      username: "awa_diop",
      displayName: "Awa Diop",
      role: "admin",
    });
    expect(result.success).toBe(false);
  });

  it("refuse un nom affiché trop court", () => {
    const result = createProfileSchema.safeParse({ username: "awa_diop", displayName: "A" });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema (F10)", () => {
  it("accepte une mise à jour partielle", () => {
    const result = updateProfileSchema.safeParse({ displayName: "Awa D." });
    expect(result.success).toBe(true);
  });

  it("refuse un patch vide", () => {
    const result = updateProfileSchema.safeParse({ bio: "" });
    expect(result.success).toBe(false);
  });

  it("refuse le username (non modifiable)", () => {
    const result = updateProfileSchema.safeParse({ username: "autre_nom" });
    expect(result.success).toBe(false);
  });
});

describe("usernameQuerySchema", () => {
  it("normalise et refuse un nom manquant", () => {
    expect(usernameQuerySchema.safeParse({ u: " AWA " }).success).toBe(true);
    expect(usernameQuerySchema.safeParse({ u: "" }).success).toBe(false);
  });
});
