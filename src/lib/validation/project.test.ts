import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  MAX_SKILLS_PER_PROJECT,
  presignProjectCoverSchema,
  publishProjectSchema,
  updateProjectSchema,
} from "./project";

describe("createProjectSchema (F05 critère 5)", () => {
  it("accepte un projet valide", () => {
    const result = createProjectSchema.safeParse({
      title: "Covoiturage",
      body: "Une app de covoiturage.",
      skillSlugs: ["react"],
    });
    expect(result.success).toBe(true);
  });

  it("refuse un titre trop court ou trop long", () => {
    expect(createProjectSchema.safeParse({ title: "ab", body: "Texte." }).success).toBe(false);
    expect(
      createProjectSchema.safeParse({ title: "a".repeat(121), body: "Texte." }).success,
    ).toBe(false);
  });

  it("refuse un texte vide", () => {
    expect(createProjectSchema.safeParse({ title: "Covoiturage", body: "   " }).success).toBe(
      false,
    );
  });

  it("refuse plus de 10 compétences", () => {
    const tooMany = Array.from({ length: MAX_SKILLS_PER_PROJECT + 1 }, (_, i) => `skill-${i}`);
    expect(
      createProjectSchema.safeParse({ title: "Covoiturage", body: "Texte.", skillSlugs: tooMany })
        .success,
    ).toBe(false);
  });

  it("normalise le slug (minuscules, accents retirés) et dédoublonne", () => {
    const result = createProjectSchema.safeParse({
      title: "Covoiturage",
      body: "Texte.",
      skillSlugs: ["Réact", "react"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.skillSlugs).toEqual(["react"]);
  });

  it("refuse un champ inconnu (.strict)", () => {
    expect(
      createProjectSchema.safeParse({ title: "Covoiturage", body: "Texte.", extra: true }).success,
    ).toBe(false);
  });

  it("refuse une clé de couverture hors du préfixe attendu", () => {
    expect(
      createProjectSchema.safeParse({
        title: "Covoiturage",
        body: "Texte.",
        coverKey: "avatars/p1/x.png",
      }).success,
    ).toBe(false);
  });
});

describe("updateProjectSchema (F05 règle 3)", () => {
  it("exige au moins un champ", () => {
    expect(updateProjectSchema.safeParse({}).success).toBe(false);
    expect(updateProjectSchema.safeParse({ title: "Nouveau titre" }).success).toBe(true);
  });
});

describe("publishProjectSchema (F06)", () => {
  it("accepte un objet vide ou une couverture valide", () => {
    expect(publishProjectSchema.safeParse({}).success).toBe(true);
    expect(
      publishProjectSchema.safeParse({
        coverKey: "projects/11111111-1111-1111-1111-111111111111/c.png",
      }).success,
    ).toBe(true);
  });
});

describe("listProjectsQuerySchema", () => {
  it("applique les valeurs par défaut et borne first à 50", () => {
    const result = listProjectsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.first).toBe(20);
    expect(listProjectsQuerySchema.safeParse({ first: 51 }).success).toBe(false);
  });
});

describe("presignProjectCoverSchema (F06)", () => {
  it("accepte une couverture valide", () => {
    const result = presignProjectCoverSchema.safeParse({
      kind: "project-cover",
      contentType: "image/jpeg",
      size: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("refuse un type d'image non supporté", () => {
    expect(
      presignProjectCoverSchema.safeParse({
        kind: "project-cover",
        contentType: "image/svg+xml",
        size: 1024,
      }).success,
    ).toBe(false);
  });

  it("refuse un fichier vide ou trop lourd (5 Mo)", () => {
    expect(
      presignProjectCoverSchema.safeParse({
        kind: "project-cover",
        contentType: "image/png",
        size: 0,
      }).success,
    ).toBe(false);
    expect(
      presignProjectCoverSchema.safeParse({
        kind: "project-cover",
        contentType: "image/png",
        size: 6 * 1024 * 1024,
      }).success,
    ).toBe(false);
  });

  it("refuse un kind inconnu (.strict)", () => {
    expect(
      presignProjectCoverSchema.safeParse({
        kind: "avatar",
        contentType: "image/png",
        size: 1024,
      }).success,
    ).toBe(false);
  });
});
