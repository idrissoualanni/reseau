import { inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles, userSkills } from "@/db/schema";
import { toConflict } from "@/lib/repositories/shared";
import type { Profile } from "@/lib/types";

type ProfileRow = typeof profiles.$inferSelect;

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

export async function findProfileByUserId(userId: string): Promise<Profile | null> {
  const [row] = await db.select().from(profiles).where(sql`${profiles.userId} = ${userId}`).limit(1);
  return row ? toProfile(row) : null;
}

export async function findProfileByUsername(username: string): Promise<Profile | null> {
  const [row] = await db
    .select()
    .from(profiles)
    .where(sql`${profiles.username} = ${username}`)
    .limit(1);
  return row ? toProfile(row) : null;
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(sql`${profiles.username} = ${username}`)
    .limit(1);
  return Boolean(row);
}

export type NewProfile = {
  userId: string;
  username: string;
  displayName: string;
  bio?: string | null;
  schoolName?: string | null;
  fieldOfStudy?: string | null;
};

export async function insertProfile(input: NewProfile): Promise<Profile> {
  try {
    const [row] = await db.insert(profiles).values(input).returning();
    if (!row) throw new Error("Insertion de profil sans ligne renvoyée.");
    return toProfile(row);
  } catch (error) {
    return toConflict(error, "Ce nom d'utilisateur est déjà utilisé.");
  }
}

export type ProfilePatch = {
  displayName?: string;
  bio?: string | null;
  schoolName?: string | null;
  fieldOfStudy?: string | null;
};

export async function updateProfileById(
  userId: string,
  patch: ProfilePatch,
): Promise<Profile | null> {
  const [row] = await db
    .update(profiles)
    .set(patch)
    .where(sql`${profiles.userId} = ${userId}`)
    .returning();
  return row ? toProfile(row) : null;
}

// Compte le nombre de compétences d'un profil (plafond applicatif de 30).
export async function countProfileSkills(profileId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userSkills)
    .where(sql`${userSkills.profileId} = ${profileId}`);
  return row?.count ?? 0;
}

// Résumé public d'un profil, utilisé par les DataLoaders GraphQL (F07) : jamais
// d'e-mail ni de `user_id` exposé.
export type ProfileSummaryRow = {
  id: string;
  username: string;
  displayName: string;
  avatarKey: string | null;
};

export async function findProfileSummariesByIds(
  ids: string[],
): Promise<ProfileSummaryRow[]> {
  if (ids.length === 0) return [];
  return db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarKey: profiles.avatarKey,
    })
    .from(profiles)
    .where(inArray(profiles.id, ids));
}
