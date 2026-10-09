import { describe, expect, it } from "vitest";
import {
  addSkillSchema,
  MAX_SKILLS_PER_PROFILE,
  normalizeSkillName,
  searchSkillsQuerySchema,
  skillNameSchema,
} from "./skills";

describe("normalizeSkillName (F04 règle 2)", () => {
  it("fusionne « Réact », « react » et « RÉACT » sur le même slug", () => {
    expect(normalizeSkillName("Réact").slug).toBe("react");
    expect(normalizeSkillName("react").slug).toBe("react");
    expect(normalizeSkillName("RÉACT").slug).toBe("react");
  });

  it("préserve la casse du nom affiché et nettoie les espaces", () => {
    const result = normalizeSkillName("  Développement   Web ");
    expect(result.name).toBe("Développement Web");
    expect(result.slug).toBe("developpement-web");
  });

  it("conserve les symboles techniques des langages", () => {
    expect(normalizeSkillName("C++").slug).toBe("c++");
    expect(normalizeSkillName("C#").slug).toBe("c#");
    expect(normalizeSkillName("Node.js").slug).toBe("node.js");
  });

  it("borne le slug à 40 caractères", () => {
    expect(normalizeSkillName("a".repeat(80)).slug.length).toBe(40);
  });
});

describe("skillNameSchema (F04)", () => {
  it("accepte un nom normal", () => {
    expect(skillNameSchema.safeParse("React").success).toBe(true);
  });

  it("refuse un nom trop court, du HTML ou un nom sans lettre", () => {
    expect(skillNameSchema.safeParse("a").success).toBe(false);
    expect(skillNameSchema.safeParse("<script>").success).toBe(false);
    expect(skillNameSchema.safeParse("!!!").success).toBe(false);
  });
});

describe("addSkillSchema", () => {
  it("exige uniquement le champ name", () => {
    expect(addSkillSchema.safeParse({ name: "React" }).success).toBe(true);
    expect(addSkillSchema.safeParse({ name: "React", extra: true }).success).toBe(false);
  });
});

describe("searchSkillsQuerySchema", () => {
  it("applique les valeurs par défaut", () => {
    const result = searchSkillsQuerySchema.safeParse({ q: undefined, limit: undefined });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("");
      expect(result.data.limit).toBe(8);
    }
  });

  it("borne la limite et accepte une limite sous forme de chaîne", () => {
    const result = searchSkillsQuerySchema.safeParse({ q: "re", limit: "5" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(5);

    expect(searchSkillsQuerySchema.safeParse({ q: "re", limit: "100" }).success).toBe(false);
  });

  it("expose un plafond de 30 compétences par profil", () => {
    expect(MAX_SKILLS_PER_PROFILE).toBe(30);
  });
});
