import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import {
  adminStats,
  listAdminAccessLog,
  listAdminPosts,
  listAdminProfiles,
  listAdminProjects,
} from "@/lib/repositories/admin";
import { findProfileByUserId } from "@/lib/repositories/profiles";
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
import type { AdminStats, Space, Profile } from "@/lib/types";
import type { CreateSpaceInput, UpdateSpaceInput } from "@/lib/validation/space";

// Cas d'usage de l'administration plateforme (F14/F16/F17). Toute autorisation
// est vérifiée ici, côté serveur ; les pages et routes ne font que l'appeler.

// Identité de l'appelant, issue de la session Neon Auth (jamais de la requête).
export type AdminContext = {
  userId: string;
  email?: string | null;
  roles: string[];
};

// Neon Auth rend `role` comme chaîne ou comme tableau selon le plugin.
export function normalizeRoles(role: unknown): string[] {
  if (Array.isArray(role)) {
    return role.filter((value): value is string => typeof value === "string");
  }
  return typeof role === "string" ? [role] : [];
}

// Construit le contexte d'administration depuis la session (jamais la requête).
export function toAdminContext(session: {
  user: { id: string; email?: string | null; role?: string | string[] | null };
}): AdminContext {
  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    roles: normalizeRoles(session.user.role),
  };
}

// Rôle plateforme = rôle `admin` Neon Auth (source unique, F16).
export function hasPlatformAdminRole(ctx: AdminContext): boolean {
  return ctx.roles.includes("admin");
}

// Profil admin plateforme, ou `null` (sans lever). Réutilisé par le layout et la nav.
export async function getPlatformAdminProfile(ctx: AdminContext): Promise<Profile | null> {
  if (!hasPlatformAdminRole(ctx)) return null;
  return findProfileByUserId(ctx.userId);
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
