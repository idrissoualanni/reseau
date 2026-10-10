import { describe, expect, it } from "vitest";
import {
  avatarKeySchema,
  createProfileSchema,
  presignAvatarSchema,
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

  it("accepte une clé d'avatar ou son retrait (F13)", () => {
    const key = "profiles/11111111-1111-1111-1111-111111111111/photo.png";
    expect(updateProfileSchema.safeParse({ avatarKey: key }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ avatarKey: null }).success).toBe(true);
  });
});

describe("avatarKeySchema (F13)", () => {
  const valid = "profiles/11111111-1111-1111-1111-111111111111/photo.webp";

  it("accepte une clé au bon format", () => {
    expect(avatarKeySchema.safeParse(valid).success).toBe(true);
  });

  it("refuse un mauvais préfixe ou un chemin hors profil", () => {
    expect(avatarKeySchema.safeParse("posts/11111111-1111-1111-1111-111111111111/x.png").success).toBe(false);
    expect(avatarKeySchema.safeParse("profiles/photo.png").success).toBe(false);
  });
});

describe("presignAvatarSchema (F13)", () => {
  it("accepte un type d'image connu dans la limite", () => {
    const result = presignAvatarSchema.safeParse({
      kind: "profile-avatar",
      contentType: "image/webp",
      size: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("refuse un type inconnu, un fichier vide ou trop lourd", () => {
    expect(
      presignAvatarSchema.safeParse({ kind: "profile-avatar", contentType: "image/svg+xml", size: 1024 })
        .success,
    ).toBe(false);
    expect(
      presignAvatarSchema.safeParse({ kind: "profile-avatar", contentType: "image/png", size: 0 })
        .success,
    ).toBe(false);
    expect(
      presignAvatarSchema.safeParse({ kind: "profile-avatar", contentType: "image/png", size: 6 * 1024 * 1024 })
        .success,
    ).toBe(false);
  });
});

describe("usernameQuerySchema", () => {
  it("normalise et refuse un nom manquant", () => {
    expect(usernameQuerySchema.safeParse({ u: " AWA " }).success).toBe(true);
    expect(usernameQuerySchema.safeParse({ u: "" }).success).toBe(false);
  });
});
