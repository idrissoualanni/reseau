import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { memberships, profiles, spaceAccessLog, spaceAccessMethods } from "@/db/schema";
import { toConflict } from "@/lib/repositories/shared";
import type {
  Membership,
  MembershipRole,
  MembershipVerification,
  Profile,
  SpaceAccessAction,
  SpaceAccessKind,
  SpaceAccessMethod,
  SpaceMember,
} from "@/lib/types";

// Couche données des appartenances et des méthodes d'accès (F15/F17) :
// seule à parler SQL/Drizzle.

type MembershipRow = typeof memberships.$inferSelect;
type AccessMethodRow = typeof spaceAccessMethods.$inferSelect;
type ProfileRow = typeof profiles.$inferSelect;

function toMembership(row: MembershipRow): Membership {
  return {
    id: row.id,
    spaceId: row.spaceId,
    profileId: row.profileId,
    role: row.role,
    verificationLevel: row.verificationLevel,
    verifiedVia: row.verifiedVia,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toAccessMethod(row: AccessMethodRow): SpaceAccessMethod {
  return {
    id: row.id,
    spaceId: row.spaceId,
    method: row.method,
    config: row.config,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    userId: row.userId,
    username: row.username,
    displayName: row.displayName,
    bio: row.bio,
    schoolName: row.schoolName,
    fieldOfStudy: row.fieldOfStudy,
    avatarKey: row.avatarKey,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── Appartenances ───────────────────────────────────────────────────────────

export async function findMembership(
  spaceId: string,
  profileId: string,
): Promise<Membership | null> {
  const [row] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.spaceId, spaceId), eq(memberships.profileId, profileId)))
    .limit(1);
  return row ? toMembership(row) : null;
}

export async function findMembershipById(id: string): Promise<Membership | null> {
  const [row] = await db.select().from(memberships).where(eq(memberships.id, id)).limit(1);
  return row ? toMembership(row) : null;
}

export type NewMembership = {
  spaceId: string;
  profileId: string;
  role?: MembershipRole;
  verificationLevel: MembershipVerification;
  verifiedVia: SpaceAccessKind;
};

export async function insertMembership(input: NewMembership): Promise<Membership> {
  try {
    const [row] = await db.insert(memberships).values(input).returning();
    if (!row) throw new Error("Insertion d'appartenance sans ligne renvoyée.");
    return toMembership(row);
  } catch (error) {
    // Contrainte memberships_space_profile_uq : un compte n'a qu'une appartenance par espace.
    return toConflict(error, "Tu es déjà membre de cet espace.");
  }
}

export async function listMembershipsForSpace(spaceId: string): Promise<SpaceMember[]> {
  const rows = await db
    .select({ membership: memberships, profile: profiles })
    .from(memberships)
    .innerJoin(profiles, eq(memberships.profileId, profiles.id))
    .where(eq(memberships.spaceId, spaceId))
    .orderBy(desc(memberships.createdAt), desc(memberships.id));
  return rows.map((row) => ({
    membership: toMembership(row.membership),
    profile: toProfile(row.profile),
  }));
}

export async function countMembers(spaceId: string): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(memberships)
    .where(eq(memberships.spaceId, spaceId));
  return row?.value ?? 0;
}

export type MembershipPatch = {
  role?: MembershipRole;
  verificationLevel?: MembershipVerification;
  verifiedVia?: SpaceAccessKind | null;
};

export async function updateMembershipById(
  id: string,
  patch: MembershipPatch,
): Promise<Membership | null> {
  const [row] = await db
    .update(memberships)
    .set(patch)
    .where(eq(memberships.id, id))
    .returning();
  return row ? toMembership(row) : null;
}

export async function deleteMembershipById(id: string): Promise<boolean> {
  const [row] = await db
    .delete(memberships)
    .where(eq(memberships.id, id))
    .returning({ id: memberships.id });
  return Boolean(row);
}

// ─── Méthodes d'accès ────────────────────────────────────────────────────────

export async function listAccessMethods(spaceId: string): Promise<SpaceAccessMethod[]> {
  const rows = await db
    .select()
    .from(spaceAccessMethods)
    .where(eq(spaceAccessMethods.spaceId, spaceId))
    .orderBy(spaceAccessMethods.method);
  return rows.map(toAccessMethod);
}

export async function listActiveAccessMethods(
  spaceId: string,
): Promise<SpaceAccessMethod[]> {
  const rows = await db
    .select()
    .from(spaceAccessMethods)
    .where(and(eq(spaceAccessMethods.spaceId, spaceId), eq(spaceAccessMethods.isActive, true)))
    .orderBy(spaceAccessMethods.method);
  return rows.map(toAccessMethod);
}

export async function upsertAccessMethod(
  spaceId: string,
  method: SpaceAccessKind,
  config: Record<string, unknown>,
  isActive: boolean,
): Promise<SpaceAccessMethod> {
  const [row] = await db
    .insert(spaceAccessMethods)
    .values({ spaceId, method, config, isActive })
    .onConflictDoUpdate({
      target: [spaceAccessMethods.spaceId, spaceAccessMethods.method],
      set: { config, isActive },
    })
    .returning();
  if (!row) throw new Error("Configuration de méthode d'accès sans ligne renvoyée.");
  return toAccessMethod(row);
}

export async function setAccessMethodActive(
  spaceId: string,
  method: SpaceAccessKind,
  isActive: boolean,
): Promise<SpaceAccessMethod | null> {
  const [row] = await db
    .update(spaceAccessMethods)
    .set({ isActive })
    .where(
      and(eq(spaceAccessMethods.spaceId, spaceId), eq(spaceAccessMethods.method, method)),
    )
    .returning();
  return row ? toAccessMethod(row) : null;
}

// ─── Journal d'accès (lecture seule côté admin) ──────────────────────────────

export type NewAccessLog = {
  spaceId: string;
  profileId: string | null;
  method: SpaceAccessKind | null;
  action: SpaceAccessAction;
};

export async function insertAccessLog(input: NewAccessLog): Promise<void> {
  await db.insert(spaceAccessLog).values(input);
}
