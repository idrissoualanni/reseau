import type { ProfileSkill, Skill } from "@/lib/types";

export function toSkillDto(skill: Skill) {
  return { id: skill.id, slug: skill.slug, name: skill.name };
}

export function toProfileSkillDto(skill: ProfileSkill) {
  return { id: skill.id, slug: skill.slug, name: skill.name, proofLevel: skill.proofLevel };
}

export type SkillDto = ReturnType<typeof toSkillDto>;
export type ProfileSkillDto = ReturnType<typeof toProfileSkillDto>;
