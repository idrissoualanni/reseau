import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  findProfileByUserId,
  findProfileByUsername,
  insertProfile,
  isUsernameTaken,
  updateProfileById,
  type ProfilePatch,
} from "@/lib/repositories/profiles";
import { listSkillsForProfile } from "@/lib/repositories/skills";
import { avatarPrefix } from "@/lib/storage";
import { RESERVED_USERNAMES, type CreateProfileInput } from "@/lib/validation/profile";
import type { Profile, ProfileSkill } from "@/lib/types";

// Cas d'usage du profil (F03/F10). L'identité vient toujours de la session :
// ces fonctions reçoivent `userId`, jamais un identifiant lu dans la requête.

export async function getOwnProfile(userId: string): Promise<Profile | null> {
  return findProfileByUserId(userId);
}

// Variante stricte : lève NOT_FOUND si le profil n'existe pas encore.
export async function requireOwnProfile(userId: string): Promise<Profile> {
  const profile = await findProfileByUserId(userId);
  if (!profile) throw new NotFoundError("Profil introuvable.");
  return profile;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  return findProfileByUsername(username);
}

// Profil public (F08) : identité + compétences avec niveau de preuve. Aucun
// identifiant d'authentification ni e-mail n'est inclus (voir mappers).
export async function getPublicProfile(
  username: string,
): Promise<{ profile: Profile; skills: ProfileSkill[] } | null> {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;
  const skills = await listSkillsForProfile(profile.id);
  return { profile, skills };
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (RESERVED_USERNAMES.has(username)) return false;
  return !(await isUsernameTaken(username));
}

// Un compte a au plus un profil (F03 règle 1) ; la contrainte unique est le
// filet de sécurité contre la condition de course.
export async function createProfile(userId: string, input: CreateProfileInput): Promise<Profile> {
  const existing = await findProfileByUserId(userId);
  if (existing) throw new ConflictError("Ton profil existe déjà.");

  return insertProfile({
    userId,
    username: input.username,
    displayName: input.displayName,
    bio: input.bio ?? null,
    schoolName: input.schoolName ?? null,
    fieldOfStudy: input.fieldOfStudy ?? null,
  });
}

// Un avatar doit vivre sous `profiles/{profile.id}/` : le préfixe est dérivé
// du profil chargé depuis la session, jamais fourni par le client (F13 règle 4).
function assertAvatarOwnership(avatarKey: string, profileId: string): void {
  if (!avatarKey.startsWith(avatarPrefix(profileId))) {
    throw new ForbiddenError("Cette image ne t'appartient pas.");
  }
}

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<Profile> {
  if (typeof patch.avatarKey === "string") {
    const profile = await requireOwnProfile(userId);
    assertAvatarOwnership(patch.avatarKey, profile.id);
  }
  const updated = await updateProfileById(userId, patch);
  if (!updated) throw new NotFoundError("Profil introuvable.");
  return updated;
}
