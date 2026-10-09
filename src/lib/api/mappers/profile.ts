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

// Vue publique (F08) : mêmes champs sûrs — `userId` et e-mail jamais exposés.
// Un membre ne voit jamais plus que ce que voit un autre, seule la gestion
// diffère (boutons réservés au propriétaire, décidés par la page).
export function toPublicProfileDto(profile: Profile) {
  return toOwnProfileDto(profile);
}

export type PublicProfileDto = ReturnType<typeof toPublicProfileDto>;
