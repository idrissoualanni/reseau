import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repositories/skills", () => ({
  addSkillToProfile: vi.fn(),
  findOrCreateSkill: vi.fn(),
  hasSkillForProfile: vi.fn(),
  listSkillsForProfile: vi.fn(),
  removeSkillFromProfile: vi.fn(),
  searchSkills: vi.fn(),
}));

vi.mock("@/lib/repositories/profiles", () => ({
  countProfileSkills: vi.fn(),
}));

import { ConflictError, RuleViolationError } from "@/lib/errors";
import * as profilesRepo from "@/lib/repositories/profiles";
import * as skillsRepo from "@/lib/repositories/skills";
import { addOwnSkill, removeOwnSkill, searchSkillCatalog } from "@/lib/skills";
import type { Skill } from "@/lib/types";

const mockedSkills = vi.mocked(skillsRepo);
const mockedProfiles = vi.mocked(profilesRepo);

const react: Skill = { id: "s1", slug: "react", name: "React" };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("addOwnSkill (F04)", () => {
  it("normalise le nom avant de chercher/créer la compétence", async () => {
    mockedSkills.findOrCreateSkill.mockResolvedValue(react);
    mockedSkills.hasSkillForProfile.mockResolvedValue(false);
    mockedProfiles.countProfileSkills.mockResolvedValue(0);
    mockedSkills.addSkillToProfile.mockResolvedValue(true);

    const result = await addOwnSkill("p1", "  Réact ");

    expect(mockedSkills.findOrCreateSkill).toHaveBeenCalledWith({
      name: "Réact",
      slug: "react",
    });
    expect(result).toEqual({ ...react, proofLevel: "declared" });
  });

  it("refuse une compétence déjà ajoutée (prioritaire sur la limite)", async () => {
    mockedSkills.findOrCreateSkill.mockResolvedValue(react);
    mockedSkills.hasSkillForProfile.mockResolvedValue(true);
    mockedProfiles.countProfileSkills.mockResolvedValue(30);

    await expect(addOwnSkill("p1", "React")).rejects.toBeInstanceOf(ConflictError);
    expect(mockedSkills.addSkillToProfile).not.toHaveBeenCalled();
  });

  it("refuse une 31ᵉ compétence", async () => {
    mockedSkills.findOrCreateSkill.mockResolvedValue(react);
    mockedSkills.hasSkillForProfile.mockResolvedValue(false);
    mockedProfiles.countProfileSkills.mockResolvedValue(30);

    await expect(addOwnSkill("p1", "React")).rejects.toBeInstanceOf(RuleViolationError);
    expect(mockedSkills.addSkillToProfile).not.toHaveBeenCalled();
  });

  it("gère la course entre deux ajouts simultanés", async () => {
    mockedSkills.findOrCreateSkill.mockResolvedValue(react);
    mockedSkills.hasSkillForProfile.mockResolvedValue(false);
    mockedProfiles.countProfileSkills.mockResolvedValue(1);
    mockedSkills.addSkillToProfile.mockResolvedValue(false);

    await expect(addOwnSkill("p1", "React")).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("removeOwnSkill (F04)", () => {
  it("retire la compétence du profil courant", async () => {
    mockedSkills.removeSkillFromProfile.mockResolvedValue(undefined);
    await removeOwnSkill("p1", "s1");
    expect(mockedSkills.removeSkillFromProfile).toHaveBeenCalledWith("p1", "s1");
  });
});

describe("searchSkillCatalog", () => {
  it("délègue au référentiel", async () => {
    mockedSkills.searchSkills.mockResolvedValue([react]);
    await expect(searchSkillCatalog("rea", 8)).resolves.toEqual([react]);
  });
});
