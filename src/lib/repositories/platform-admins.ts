import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import { platformAdmins, profiles } from "@/db/schema";
import type { AdminPlatformAdminRecord, ProfileRef } from "@/lib/types";

// Couche données des admins plateforme (F16).

const granter = alias(profiles, "granter");

export async function isPlatformAdmin(profileId: string): Promise<boolean> {
  const [row] = await db
    .select({ profileId: platformAdmins.profileId })
    .from(platformAdmins)
    .where(eq(platformAdmins.profileId, profileId))
    .limit(1);
  return Boolean(row);
}

export async function countPlatformAdmins(): Promise<number> {
  const [row] = await db.select({ value: sql<number>`count(*)::int` }).from(platformAdmins);
  return row?.value ?? 0;
}

export async function listPlatformAdmins(): Promise<AdminPlatformAdminRecord[]> {
  const rows = await db
    .select({
      profileId: platformAdmins.profileId,
      grantedAt: platformAdmins.grantedAt,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarKey: profiles.avatarKey,
      granterId: granter.id,
      granterUsername: granter.username,
      granterDisplayName: granter.displayName,
      granterAvatarKey: granter.avatarKey,
    })
    .from(platformAdmins)
    .innerJoin(profiles, eq(platformAdmins.profileId, profiles.id))
    .leftJoin(granter, eq(platformAdmins.grantedBy, granter.id))
    .orderBy(platformAdmins.grantedAt);

  return rows.map((row) => ({
    profileId: row.profileId,
    grantedAt: row.grantedAt,
    profile: {
      id: row.profileId,
      username: row.username,
      displayName: row.displayName,
      avatarKey: row.avatarKey,
    },
    grantedBy: toGranter(row),
  }));
}

function toGranter(row: {
  granterId: string | null;
  granterUsername: string | null;
  granterDisplayName: string | null;
  granterAvatarKey: string | null;
}): ProfileRef | null {
  if (!row.granterId || !row.granterUsername || !row.granterDisplayName) return null;
  return {
    id: row.granterId,
    username: row.granterUsername,
    displayName: row.granterDisplayName,
    avatarKey: row.granterAvatarKey,
  };
}

export async function insertPlatformAdmin(
  profileId: string,
  grantedBy: string | null,
): Promise<void> {
  await db.insert(platformAdmins).values({ profileId, grantedBy }).onConflictDoNothing();
}

export async function deletePlatformAdmin(profileId: string): Promise<boolean> {
  const [row] = await db
    .delete(platformAdmins)
    .where(eq(platformAdmins.profileId, profileId))
    .returning({ profileId: platformAdmins.profileId });
  return Boolean(row);
}
