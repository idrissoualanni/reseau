import type { Membership, Space, SpaceAccessMethod, SpaceMember } from "@/lib/types";
import { toAuthorSummary } from "./profile";

// DTO des espaces et des appartenances (F15). Aucun identifiant interne
// (`spaceId`, `profileId`, `config`, `code`, `token`) ne sort jamais.

export type MembershipDto = {
  id: string;
  role: Membership["role"];
  verificationLevel: Membership["verificationLevel"];
  verifiedVia: Membership["verifiedVia"];
  createdAt: string;
};

export function toMembershipDto(membership: Membership): MembershipDto {
  return {
    id: membership.id,
    role: membership.role,
    verificationLevel: membership.verificationLevel,
    verifiedVia: membership.verifiedVia,
    createdAt: membership.createdAt.toISOString(),
  };
}

// Un membre vu par un gestionnaire : statut déduit du niveau de vérification.
export function toSpaceMemberDto({ membership, profile }: SpaceMember) {
  return {
    id: membership.id,
    role: membership.role,
    verificationLevel: membership.verificationLevel,
    verifiedVia: membership.verifiedVia,
    status: membership.verificationLevel === "verified" ? ("active" as const) : ("pending" as const),
    member: toAuthorSummary(profile),
  };
}

export type SpaceDetailDto = ReturnType<typeof toSpaceDetailDto>;

export function toSpaceDetailDto(
  space: Space,
  memberCount: number,
  accessMethods: SpaceAccessMethod[],
  membership: Membership | null,
) {
  return {
    id: space.id,
    slug: space.slug,
    name: space.name,
    description: space.description,
    type: space.type,
    visibility: space.visibility,
    memberCount,
    // Seuls les kinds actifs sortent ; jamais leur `config` (hash de code/jeton).
    accessMethods: accessMethods.filter((m) => m.isActive).map((m) => m.method),
    membership: membership ? toMembershipDto(membership) : null,
  };
}
