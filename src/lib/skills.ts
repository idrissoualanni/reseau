import { ConflictError, RuleViolationError } from "@/lib/errors";
import {
  addSkillToProfile,
  findOrCreateSkill,
  hasSkillForProfile,
  listSkillsForProfile,
  removeSkillFromProfile,
  searchSkills,
} from "@/lib/repositories/skills";
import { countProfileSkills } from "@/lib/repositories/profiles";
import { MAX_SKILLS_PER_PROFILE, normalizeSkillName } from "@/lib/validation/skills";
import type { ProfileSkill, Skill } from "@/lib/types";

// Cas d'usage des compétences (F04). Le `profileId` vient du profil chargé
// depuis la session, jamais du client.

export async function listOwnSkills(profileId: string): Promise<ProfileSkill[]> {
  return listSkillsForProfile(profileId);
}

export async function searchSkillCatalog(query: string, limit: number): Promise<Skill[]> {
  return searchSkills(query, limit);
}

export async function addOwnSkill(profileId: string, rawName: string): Promise<ProfileSkill> {
  const { name, slug } = normalizeSkillName(rawName);
  const skill = await findOrCreateSkill({ name, slug });

  // « Déjà ajoutée » prime sur « limite atteinte » : le message le plus utile.
  if (await hasSkillForProfile(profileId, skill.id)) {
    throw new ConflictError("Tu as déjà cette compétence.");
  }

  const current = await countProfileSkills(profileId);
  if (current >= MAX_SKILLS_PER_PROFILE) {
    throw new RuleViolationError(
      `Tu peux ajouter jusqu'à ${MAX_SKILLS_PER_PROFILE} compétences.`,
    );
  }

  const created = await addSkillToProfile(profileId, skill.id);
  if (!created) throw new ConflictError("Tu as déjà cette compétence.");

  return { ...skill, proofLevel: "declared" };
}

export async function removeOwnSkill(profileId: string, skillId: string): Promise<void> {
  await removeSkillFromProfile(profileId, skillId);
}
