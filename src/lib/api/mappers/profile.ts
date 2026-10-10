import type { Profile } from "@/lib/types";
import { getPublicUrl } from "@/lib/storage";
import type { ProfileSummaryRow } from "@/lib/repositories/profiles";

// Vue propriétaire : `userId` (identifiant d'authentification) n'est JAMAIS
// exposé. `username` est l'identifiant public. La clé de stockage reste
// interne : seule l'URL publique `avatarUrl` sort (api-rest §10, F13 règle 5).
export function toOwnProfileDto(profile: Profile) {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    schoolName: profile.schoolName,
    fieldOfStudy: profile.fieldOfStudy,
    avatarUrl: profile.avatarKey ? getPublicUrl(profile.avatarKey) : null,
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

// Auteur d'un fil/commentaire : vue sérialisable sans clé de stockage (les
// composants client n'ont que l'URL publique). Remplace `ProfileSummaryRow`
// brut qui fuitait `avatarKey` hors du serveur (règle 6 F13).
export type AuthorSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export function toAuthorSummary(row: ProfileSummaryRow | null): AuthorSummary | null {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarKey ? getPublicUrl(row.avatarKey) : null,
  };
}