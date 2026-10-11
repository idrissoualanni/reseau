import { getPlatformAdminEmails } from "@/lib/env";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RuleViolationError,
} from "@/lib/errors";
import {
  adminStats,
  listAdminAccessLog,
  listAdminPosts,
  listAdminProfiles,
  listAdminProjects,
} from "@/lib/repositories/admin";
import {
  countPlatformAdmins,
  deletePlatformAdmin,
  insertPlatformAdmin,
  isPlatformAdmin,
  listPlatformAdmins,
} from "@/lib/repositories/platform-admins";
import { findProfileById, findProfileByUserId, findProfileByUsername } from "@/lib/repositories/profiles";
import {
  archiveSpaceById,
  findSpaceById,
  findSpaceBySlug,
  insertSpace,
  isSpaceSlugTaken,
  listAllSpaces,
  listPublicSpaces,
  listSpacesWithMemberCounts,
  updateSpaceById,
  type SpaceWithMemberCount,
} from "@/lib/repositories/spaces";
import type { AdminStats, AdminPlatformAdminRecord, Space, Profile } from "@/lib/types";
import type { CreateSpaceInput, UpdateSpaceInput } from "@/lib/validation/space";

// Cas d'usage de l'administration plateforme (F14/F16/F17). Toute autorisation
// est vérifiée ici, côté serveur ; les pages et routes ne font que l'appeler.

// Identité de l'appelant, issue de la session Neon Auth (jamais de la requête).
export type AdminContext = {
  userId: string;
  email?: string | null;
};

// Construit le contexte d'administration depuis la session (jamais la requête).
export function toAdminContext(session: {
  user: { id: string; email?: string | null };
}): AdminContext {
  return { userId: session.user.id, email: session.user.email ?? null };
}

// Profil admin plateforme, ou `null` (sans lever). Réutilisé par le layout et la nav.
export async function getPlatformAdminProfile(ctx: AdminContext): Promise<Profile | null> {
  const profile = await findProfileByUserId(ctx.userId);
  if (!profile) return null;
  if (await isPlatformAdmin(profile.id)) return profile;

  // Amorçage par liste blanche d'e-mails (idempotent) : seul chemin d'élévation.
  const email = ctx.email?.trim().toLowerCase();
  if (email && getPlatformAdminEmails().has(email)) {
    await insertPlatformAdmin(profile.id, null);
    return profile;
  }
  return null;
}

export async function requirePlatformAdmin(ctx: AdminContext): Promise<Profile> {
  const admin = await getPlatformAdminProfile(ctx);
  if (!admin) throw new ForbiddenError();
  return admin;
}

// ─── Espaces (F14) ───────────────────────────────────────────────────────────

// Lecture publique (utilisateur connecté) : espaces publics non archivés.
export async function listPublicSpacesUseCase(): Promise<Space[]> {
  return listPublicSpaces();
}

export async function getPublicSpaceBySlug(slug: string): Promise<Space> {
  const space = await findSpaceBySlug(slug);
  if (!space || space.archivedAt || space.visibility !== "public") {
    throw new NotFoundError("Espace introuvable.");
  }
  return space;
}

export async function listSpacesForAdmin(
  ctx: AdminContext,
): Promise<SpaceWithMemberCount[]> {
  await requirePlatformAdmin(ctx);
  return listSpacesWithMemberCounts();
}

export async function getSpaceForAdmin(ctx: AdminContext, id: string): Promise<Space> {
  await requirePlatformAdmin(ctx);
  const space = await findSpaceById(id);
  if (!space) throw new NotFoundError("Espace introuvable.");
  return space;
}

export async function createSpace(ctx: AdminContext, input: CreateSpaceInput): Promise<Space> {
  const admin = await requirePlatformAdmin(ctx);
  if (await isSpaceSlugTaken(input.slug)) {
    throw new ConflictError("Un espace utilise déjà ce slug.");
  }
  return insertSpace(input, admin.id);
}

export async function updateSpace(
  ctx: AdminContext,
  id: string,
  input: UpdateSpaceInput,
): Promise<Space> {
  await requirePlatformAdmin(ctx);
  const existing = await findSpaceById(id);
  if (!existing) throw new NotFoundError("Espace introuvable.");

  const space = await updateSpaceById(id, {
    name: input.name,
    // `undefined` = champ absent ; `""` = effacer la description.
    description: input.description === undefined ? undefined : input.description || null,
    visibility: input.visibility,
  });
  if (!space) throw new NotFoundError("Espace introuvable.");
  return space;
}

export async function archiveSpace(ctx: AdminContext, id: string): Promise<void> {
  await requirePlatformAdmin(ctx);
  const existing = await findSpaceById(id);
  if (!existing) throw new NotFoundError("Espace introuvable.");
  if (existing.archivedAt) return;
  await archiveSpaceById(id);
}

// ─── Admins plateforme (F16) ─────────────────────────────────────────────────

export async function listPlatformAdminsUseCase(
  ctx: AdminContext,
): Promise<AdminPlatformAdminRecord[]> {
  await requirePlatformAdmin(ctx);
  return listPlatformAdmins();
}

export async function grantPlatformAdmin(ctx: AdminContext, profileId: string): Promise<void> {
  const admin = await requirePlatformAdmin(ctx);
  const profile = await findProfileById(profileId);
  if (!profile) throw new NotFoundError("Profil introuvable.");
  await insertPlatformAdmin(profileId, admin.id);
}

// Nomination depuis l'interface : le nom d'utilisateur public est plus commode
// que l'identifiant interne. La résolution se fait côté serveur.
export async function grantPlatformAdminByUsername(
  ctx: AdminContext,
  username: string,
): Promise<void> {
  const admin = await requirePlatformAdmin(ctx);
  const profile = await findProfileByUsername(username);
  if (!profile) throw new NotFoundError("Profil introuvable.");
  await insertPlatformAdmin(profile.id, admin.id);
}

export async function revokePlatformAdmin(ctx: AdminContext, profileId: string): Promise<void> {
  await requirePlatformAdmin(ctx);
  if ((await countPlatformAdmins()) <= 1) {
    throw new RuleViolationError("Il doit rester au moins un administrateur.");
  }
  const removed = await deletePlatformAdmin(profileId);
  if (!removed) throw new NotFoundError("Administrateur introuvable.");
}

// ─── Vues « tout voir » (F17) ────────────────────────────────────────────────

export async function listAccessLogForAdmin(ctx: AdminContext, spaceId?: string) {
  await requirePlatformAdmin(ctx);
  return listAdminAccessLog(spaceId);
}

export async function listProfilesForAdmin(ctx: AdminContext) {
  await requirePlatformAdmin(ctx);
  return listAdminProfiles();
}

export async function listPostsForAdmin(ctx: AdminContext) {
  await requirePlatformAdmin(ctx);
  return listAdminPosts();
}

export async function listProjectsForAdmin(ctx: AdminContext) {
  await requirePlatformAdmin(ctx);
  return listAdminProjects();
}

export async function getAdminStats(ctx: AdminContext): Promise<AdminStats> {
  await requirePlatformAdmin(ctx);
  return adminStats();
}

// Tous les espaces (archivés inclus) pour les sélecteurs d'administration.
export async function listAllSpacesForAdmin(ctx: AdminContext): Promise<Space[]> {
  await requirePlatformAdmin(ctx);
  return listAllSpaces();
}
