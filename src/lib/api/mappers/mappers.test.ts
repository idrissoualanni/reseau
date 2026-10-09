import { describe, expect, it } from "vitest";
import { toOwnProfileDto } from "./profile";
import { toProfileSkillDto, toSkillDto } from "./skills";
import type { Profile, ProfileSkill } from "@/lib/types";

const profile: Profile = {
  id: "p1",
  userId: "u1-secret",
  username: "awa_diop",
  displayName: "Awa Diop",
  bio: null,
  schoolName: "UCAD",
  fieldOfStudy: null,
  avatarKey: null,
  createdAt: new Date("2026-01-01T10:00:00Z"),
  updatedAt: new Date("2026-01-02T10:00:00Z"),
};

describe("toOwnProfileDto", () => {
  it("n'expose jamais le user_id et sérialise les dates en ISO", () => {
    const dto = toOwnProfileDto(profile);
    expect(dto).not.toHaveProperty("userId");
    expect(dto.username).toBe("awa_diop");
    expect(dto.createdAt).toBe("2026-01-01T10:00:00.000Z");
  });
});

describe("mappers de compétences", () => {
  it("projette une compétence du référentiel", () => {
    expect(toSkillDto({ id: "s1", slug: "react", name: "React" })).toEqual({
      id: "s1",
      slug: "react",
      name: "React",
    });
  });

  it("projette une compétence de profil avec son niveau", () => {
    const skill: ProfileSkill = {
      id: "s1",
      slug: "react",
      name: "React",
      proofLevel: "demonstrated",
    };
    expect(toProfileSkillDto(skill)).toEqual({
      id: "s1",
      slug: "react",
      name: "React",
      proofLevel: "demonstrated",
    });
  });
});
