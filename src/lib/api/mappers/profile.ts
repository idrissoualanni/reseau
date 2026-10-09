import type { Profile } from "@/lib/types";

// Vue propriétaire : `userId` (identifiant d'authentification) n'est JAMAIS
// exposé. `username` est l'identifiant public.
export function toOwnProfileDto(profile: Profile) {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    schoolName: profile.schoolName,
    fieldOfStudy: profile.fieldOfStudy,
    avatarKey: profile.avatarKey,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export type OwnProfileDto = ReturnType<typeof toOwnProfileDto>;
