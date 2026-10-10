import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repositories/search", () => ({
  findSkillBySlugForSearch: vi.fn(),
  searchStudentsBySkill: vi.fn(),
  toSearchCursor: (row: { id: string; proofLevel: string; projectCount: number; createdAt: Date }) => ({
    proofRank: row.proofLevel === "demonstrated" ? 0 : 1,
    projectCount: row.projectCount,
    createdAt: row.createdAt,
    id: row.id,
  }),
}));

vi.mock("@/lib/repositories/skills", () => ({
  searchSkills: vi.fn(),
}));

import { ValidationError } from "@/lib/errors";
import * as searchRepo from "@/lib/repositories/search";
import * as skillsRepo from "@/lib/repositories/skills";
import { searchStudents } from "@/lib/search";
import type { StudentSearchResult } from "@/lib/repositories/search";

const mockedSearch = vi.mocked(searchRepo);
const mockedSkills = vi.mocked(skillsRepo);

const react = { id: "s1", slug: "react", name: "React" };

const row = (overrides: Partial<StudentSearchResult> = {}): StudentSearchResult => ({
  id: "p1",
  username: "awa_diop",
  displayName: "Awa Diop",
  schoolName: "UCAD",
  fieldOfStudy: null,
  avatarKey: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  proofLevel: "declared",
  projectCount: 0,
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe("searchStudents (F09)", () => {
  it("normalise l'entrée et renvoie les résultats sans donnée privée", async () => {
    mockedSearch.findSkillBySlugForSearch.mockResolvedValue(react);
    mockedSearch.searchStudentsBySkill.mockResolvedValue([row()]);

    const result = await searchStudents(
      { userId: "u1", profileId: "p1" },
      { skill: " React ", limit: 20 },
    );

    expect(mockedSearch.findSkillBySlugForSearch).toHaveBeenCalledWith("react");
    expect(mockedSearch.searchStudentsBySkill).toHaveBeenCalledWith("s1", 20, undefined);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).not.toHaveProperty("userId");
    expect(result.items[0]).not.toHaveProperty("email");
    expect(result.skill).toEqual(react);
  });

  it("competence inconnue : liste vide + suggestions proches", async () => {
    mockedSearch.findSkillBySlugForSearch.mockResolvedValue(null);
    mockedSkills.searchSkills.mockResolvedValue([react]);

    const result = await searchStudents(
      { userId: "u1", profileId: "p1" },
      { skill: "javascipt", limit: 20 },
    );

    expect(result.items).toEqual([]);
    expect(result.skill).toBeNull();
    expect(result.suggestions).toEqual([react]);
    expect(mockedSkills.searchSkills).toHaveBeenCalledWith("javascipt", 5);
    expect(mockedSearch.searchStudentsBySkill).not.toHaveBeenCalled();
  });

  it("« react » et « réact » donnent le même slug (même résultat)", async () => {
    mockedSearch.findSkillBySlugForSearch.mockResolvedValue(react);
    mockedSearch.searchStudentsBySkill.mockResolvedValue([row()]);

    const a = await searchStudents({ userId: "u1", profileId: "p1" }, { skill: "react", limit: 20 });
    const b = await searchStudents({ userId: "u1", profileId: "p1" }, { skill: "réact", limit: 20 });

    expect(mockedSearch.findSkillBySlugForSearch).toHaveBeenNthCalledWith(1, "react");
    expect(mockedSearch.findSkillBySlugForSearch).toHaveBeenNthCalledWith(2, "react");
    expect(a.items).toEqual(b.items);
  });

  it("curseur invalide : ValidationError", async () => {
    mockedSearch.findSkillBySlugForSearch.mockResolvedValue(react);

    await expect(
      searchStudents(
        { userId: "u1", profileId: "p1" },
        { skill: "react", limit: 20, cursor: "pas-un-curseur-valide" },
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(mockedSearch.searchStudentsBySkill).not.toHaveBeenCalled();
  });

  it("decode un curseur tuple valide et le transmet au repository", async () => {
    const { encodeTupleCursor } = await import("@/lib/pagination");
    const cursor = encodeTupleCursor([0, 3, new Date("2026-01-01T00:00:00Z"), "p1"]);

    mockedSearch.findSkillBySlugForSearch.mockResolvedValue(react);
    mockedSearch.searchStudentsBySkill.mockResolvedValue([row()]);

    await searchStudents(
      { userId: "u1", profileId: "p1" },
      { skill: "react", limit: 20, cursor },
    );

    expect(mockedSearch.searchStudentsBySkill).toHaveBeenCalledWith(
      "s1",
      20,
      { proofRank: 0, projectCount: 3, createdAt: new Date("2026-01-01T00:00:00Z"), id: "p1" },
    );
  });

  it("nextCursor absent quand le repository renvoie moins de limit lignes", async () => {
    mockedSearch.findSkillBySlugForSearch.mockResolvedValue(react);
    mockedSearch.searchStudentsBySkill.mockResolvedValue([row()]);

    const result = await searchStudents(
      { userId: "u1", profileId: "p1" },
      { skill: "react", limit: 20 },
    );

    expect(result.nextCursor).toBeNull();
  });

  it("nextCursor present quand le repository renvoie limit + 1 lignes", async () => {
    mockedSearch.findSkillBySlugForSearch.mockResolvedValue(react);
    mockedSearch.searchStudentsBySkill.mockResolvedValue([
      row({ id: "p1", createdAt: new Date("2026-01-01T00:00:00Z") }),
      row({ id: "p2", createdAt: new Date("2026-01-02T00:00:00Z") }),
    ]);

    const result = await searchStudents(
      { userId: "u1", profileId: "p1" },
      { skill: "react", limit: 1 },
    );

    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).not.toBeNull();
  });

  it("entrée vide : ni repository ni suggestion", async () => {
    const result = await searchStudents(
      { userId: "u1", profileId: "p1" },
      { skill: "   ", limit: 20 },
    );

    expect(result.items).toEqual([]);
    expect(result.suggestions).toEqual([]);
    expect(mockedSearch.findSkillBySlugForSearch).not.toHaveBeenCalled();
  });
});