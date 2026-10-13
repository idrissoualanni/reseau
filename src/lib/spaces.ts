import { randomBytes } from "node:crypto";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import {
  getPublicSpaceBySlug,
  hasPlatformAdminRole,
  type AdminContext,
} from "@/lib/admin";
import { findProfileByUserId } from "@/lib/repositories/profiles";
import {
  countMembers,
  deleteMembershipById,
  findMembership,
  insertAccessLog,
  insertMembership,
  listAccessMethods,
  listActiveAccessMethods,
  listMembershipsForSpace,
  updateMembershipById,
  upsertAccessMethod,
} from "@/lib/repositories/space-members";
import { hashSecret, resolveAccessMethod } from "@/lib/spaces/access-methods";
import type {
  Membership,
  Profile,
  Space,
  SpaceAccessKind,
  SpaceAccessMethod,
  SpaceMember,
} from "@/lib/types";
import type {
  JoinSpaceInput,
  SetAccessMethodInput,
  SetMembershipRoleInput,
} from "@/lib/validation/space";

// Cas d'usage des espaces et de leurs accès (F15). Toute autorisation est
// vérifiée ici, côté serveur ; les pages et routes ne font que les appeler.

// Identité publique d'un utilisateur connecté (profil déjà créé).
export type SpaceUserContext = {
  userId: string;
  profileId: string;
};

// Durée par défaut d'un lien d'invitation : 30 jours.
const INVITE_LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function randomToken(bytes: number): string {
  return randomBytes(bytes).toString("base64url");
}

// ─── Lecture publique ────────────────────────────────────────────────────────

export type PublicSpaceDetail = {
  space: Space;
  accessMethods: SpaceAccessMethod[];
  memberCount: number;
  membership: Membership | null;
};

// Détail d'un espace public non archivé, avec ses méthodes actives et, si un
// lecteur est connu, sa propre appartenance (jamais celle d'un autre).
export async function getPublicSpaceDetail(
  slug: string,
  viewer?: { profileId: string },
): Promise<PublicSpaceDetail> {
  const space = await getPublicSpaceBySlug(slug);
  const [accessMethods, memberCount, membership] = await Promise.all([
    listActiveAccessMethods(space.id),
    countMembers(space.id),
    viewer ? findMembership(space.id, viewer.profileId) : Promise.resolve(null),
  ]);
  return { space, accessMethods, memberCount, membership };
}

// Membres vérifiés d'un espace public, pour l'affichage public (borné).
export async function getPublicSpaceMembers(
  slug: string,
  limit = 24,
): Promise<SpaceMember[]> {
  const space = await getPublicSpaceBySlug(slug);
  const members = await listMembershipsForSpace(space.id);
  return members
    .filter((member) => member.membership.verificationLevel === "verified")
    .slice(0, limit);
}

// ─── Rejoindre un espace ─────────────────────────────────────────────────────

export type JoinSpaceResult = {
  status: "joined" | "pending";
  membership: Membership;
};

// Rejoint (ou demande à rejoindre) un espace par la méthode choisie. L'identité
// du demandeur vient toujours de la session, jamais de la requête.
export async function joinSpace(
  viewer: { profileId: string },
  slug: string,
  input: JoinSpaceInput,
): Promise<JoinSpaceResult> {
  const space = await getPublicSpaceBySlug(slug);
  const methods = await listActiveAccessMethods(space.id);
  const method = methods.find((candidate) => candidate.method === input.method);
  if (!method) throw new NotFoundError("Méthode d'accès indisponible.");

  // Une seule appartenance par (espace, profil) : on distingue la demande
  // en attente du membre actif pour un message exact (F15 règle 6).
  const existing = await findMembership(space.id, viewer.profileId);
  if (existing) {
    if (
      existing.verificationLevel === "unverified" &&
      existing.verifiedVia === "manual_approval"
    ) {
      throw new ConflictError("Ta demande est déjà en attente.");
    }
    throw new ConflictError("Tu es déjà membre de cet espace.");
  }

  const decision = resolveAccessMethod(method, { code: input.code, token: input.token });
  const membership = await insertMembership({
    spaceId: space.id,
    profileId: viewer.profileId,
    verificationLevel: decision.verificationLevel,
    verifiedVia: decision.verifiedVia,
  });
  await insertAccessLog({
    spaceId: space.id,
    profileId: viewer.profileId,
    method: input.method,
    action: decision.action,
  });

  return {
    status: decision.action === "request" ? "pending" : "joined",
    membership,
  };
}

// ─── Autorisation espace ─────────────────────────────────────────────────────

// Autorisé pour un admin plateforme, ou pour un `space_admin` de cet espace.
// Le profil est renvoyé pour que les cas d'usage en aient besoin.
export async function requireSpaceManagerOrPlatform(
  ctx: AdminContext,
  spaceId: string,
): Promise<{ profile: Profile }> {
  const profile = await findProfileByUserId(ctx.userId);
  if (!profile) throw new ForbiddenError();

  if (hasPlatformAdminRole(ctx)) return { profile };

  const membership = await findMembership(spaceId, profile.id);
  if (membership && membership.role === "space_admin") return { profile };

  throw new ForbiddenError();
}

// Vérifie qu'une appartenance appartient bien à l'espace avant de la muter.
async function findMemberTarget(spaceId: string, membershipId: string): Promise<SpaceMember> {
  const members = await listMembershipsForSpace(spaceId);
  const target = members.find((member) => member.membership.id === membershipId);
  if (!target) throw new NotFoundError("Appartenance introuvable.");
  return target;
}

// ─── Gestion des membres (F17) ───────────────────────────────────────────────

export async function listSpaceMembers(
  ctx: AdminContext,
  spaceId: string,
): Promise<SpaceMember[]> {
  await requireSpaceManagerOrPlatform(ctx, spaceId);
  return listMembershipsForSpace(spaceId);
}

export async function listPendingSpaceMembers(
  ctx: AdminContext,
  spaceId: string,
): Promise<SpaceMember[]> {
  await requireSpaceManagerOrPlatform(ctx, spaceId);
  const members = await listMembershipsForSpace(spaceId);
  return members.filter((member) => member.membership.verificationLevel === "unverified");
}

// Vue unique pour la console : une seule autorisation, une seule requête.
// `members` = appartenances vérifiées, `pending` = demandes en attente.
export async function listSpaceMembersOverview(
  ctx: AdminContext,
  spaceId: string,
): Promise<{ members: SpaceMember[]; pending: SpaceMember[] }> {
  await requireSpaceManagerOrPlatform(ctx, spaceId);
  const all = await listMembershipsForSpace(spaceId);
  return {
    members: all.filter((member) => member.membership.verificationLevel === "verified"),
    pending: all.filter((member) => member.membership.verificationLevel === "unverified"),
  };
}

// Approuve une demande : l'appartenance passe à `verified` et l'action est journalisée.
export async function approveMembership(
  ctx: AdminContext,
  spaceId: string,
  membershipId: string,
): Promise<Membership> {
  await requireSpaceManagerOrPlatform(ctx, spaceId);
  const target = await findMemberTarget(spaceId, membershipId);

  const updated = await updateMembershipById(membershipId, { verificationLevel: "verified" });
  if (!updated) throw new NotFoundError("Appartenance introuvable.");

  await insertAccessLog({
    spaceId,
    profileId: target.membership.profileId,
    method: target.membership.verifiedVia,
    action: "approve",
  });
  return updated;
}

// Refuse une demande en attente : on supprime la ligne (aucune trace hors journal).
export async function rejectMembership(
  ctx: AdminContext,
  spaceId: string,
  membershipId: string,
): Promise<void> {
  await requireSpaceManagerOrPlatform(ctx, spaceId);
  const target = await findMemberTarget(spaceId, membershipId);

  await deleteMembershipById(membershipId);
  await insertAccessLog({
    spaceId,
    profileId: target.membership.profileId,
    method: target.membership.verifiedVia,
    action: "reject",
  });
}

// Retire un membre : même mécanique que le refus, journalisation différente.
export async function revokeMembership(
  ctx: AdminContext,
  spaceId: string,
  membershipId: string,
): Promise<void> {
  await requireSpaceManagerOrPlatform(ctx, spaceId);
  const target = await findMemberTarget(spaceId, membershipId);

  await deleteMembershipById(membershipId);
  await insertAccessLog({
    spaceId,
    profileId: target.membership.profileId,
    method: target.membership.verifiedVia,
    action: "revoke",
  });
}

export async function setMembershipRole(
  ctx: AdminContext,
  spaceId: string,
  membershipId: string,
  input: SetMembershipRoleInput,
): Promise<Membership> {
  await requireSpaceManagerOrPlatform(ctx, spaceId);
  await findMemberTarget(spaceId, membershipId);

  const updated = await updateMembershipById(membershipId, { role: input.role });
  if (!updated) throw new NotFoundError("Appartenance introuvable.");
  return updated;
}

// Décision unique de la console : approuver ou refuser, en un seul cas d'usage.
export async function decideMembership(
  ctx: AdminContext,
  spaceId: string,
  membershipId: string,
  decision: "approve" | "reject",
): Promise<Membership | null> {
  if (decision === "approve") {
    return approveMembership(ctx, spaceId, membershipId);
  }
  await rejectMembership(ctx, spaceId, membershipId);
  return null;
}

// ─── Configuration des méthodes d'accès (F15/F17) ────────────────────────────

export async function getSpaceAccessMethods(
  ctx: AdminContext,
  spaceId: string,
): Promise<SpaceAccessMethod[]> {
  await requireSpaceManagerOrPlatform(ctx, spaceId);
  return listAccessMethods(spaceId);
}

export type ConfigureAccessMethodResult = {
  method: SpaceAccessMethod;
  // Secret en clair, renvoyé UNE SEULE FOIS à la génération ; jamais stocké.
  secret?: string;
};

export async function configureAccessMethod(
  ctx: AdminContext,
  spaceId: string,
  method: SpaceAccessKind,
  input: SetAccessMethodInput,
): Promise<ConfigureAccessMethodResult> {
  await requireSpaceManagerOrPlatform(ctx, spaceId);

  let config: Record<string, unknown> = {};
  let secret: string | undefined;

  if (method === "invite_code") {
    if (input.code) {
      config = { codeHash: hashSecret(input.code) };
    } else if (input.regenerate) {
      const code = randomToken(6);
      config = { codeHash: hashSecret(code) };
      secret = code;
    } else {
      // Ni code ni régénération : on conserve le hash existant (simple activation).
      const existing = (await listAccessMethods(spaceId)).find(
        (candidate) => candidate.method === method,
      );
      config = existing?.config ?? {};
    }
  } else if (method === "invite_link") {
    // On ne régénère le lien que sur demande : un simple (dé)activer ne doit pas
    // invalider les liens déjà diffusés.
    const existing = (await listAccessMethods(spaceId)).find(
      (candidate) => candidate.method === method,
    );
    const hasToken = typeof existing?.config.tokenHash === "string";
    if (hasToken && !input.regenerate) {
      config = existing?.config ?? {};
    } else {
      const token = randomToken(24);
      const expiresAt = new Date(Date.now() + INVITE_LINK_TTL_MS).toISOString();
      config = { tokenHash: hashSecret(token), expiresAt };
      secret = token;
    }
  }
  // `open` et `manual_approval` n'ont aucune configuration.

  const saved = await upsertAccessMethod(spaceId, method, config, input.isActive);
  return secret === undefined ? { method: saved } : { method: saved, secret };
}
