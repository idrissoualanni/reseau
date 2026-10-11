import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { memberships, spaces } from "@/db/schema";
import { toConflict } from "@/lib/repositories/shared";
import type { Space, SpaceType, SpaceVisibility } from "@/lib/types";

// Couche données des espaces (F14) : seule à parler SQL/Drizzle.

type SpaceRow = typeof spaces.$inferSelect;

function toSpace(row: SpaceRow): Space {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    type: row.type,
    visibility: row.visibility,
    metadata: row.metadata,
    createdBy: row.createdBy,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findSpaceById(id: string): Promise<Space | null> {
  const [row] = await db.select().from(spaces).where(eq(spaces.id, id)).limit(1);
  return row ? toSpace(row) : null;
}

export async function findSpaceBySlug(slug: string): Promise<Space | null> {
  const [row] = await db.select().from(spaces).where(eq(spaces.slug, slug)).limit(1);
  return row ? toSpace(row) : null;
}

export async function isSpaceSlugTaken(slug: string): Promise<boolean> {
  const [row] = await db.select({ id: spaces.id }).from(spaces).where(eq(spaces.slug, slug)).limit(1);
  return Boolean(row);
}

// Espaces publics non archivés (page `/spaces`).
export async function listPublicSpaces(): Promise<Space[]> {
  const rows = await db
    .select()
    .from(spaces)
    .where(sql`${spaces.visibility} = 'public' and ${spaces.archivedAt} is null`)
    .orderBy(desc(spaces.createdAt), desc(spaces.id));
  return rows.map(toSpace);
}

// Tous les espaces, archivés compris (console d'administration).
export async function listAllSpaces(): Promise<Space[]> {
  const rows = await db.select().from(spaces).orderBy(desc(spaces.createdAt), desc(spaces.id));
  return rows.map(toSpace);
}

export type SpaceWithMemberCount = { space: Space; memberCount: number };

export async function listSpacesWithMemberCounts(): Promise<SpaceWithMemberCount[]> {
  const rows = await db
    .select({
      space: spaces,
      memberCount: sql<number>`count(${memberships.id})::int`,
    })
    .from(spaces)
    .leftJoin(memberships, eq(memberships.spaceId, spaces.id))
    .groupBy(spaces.id)
    .orderBy(desc(spaces.createdAt), desc(spaces.id));
  return rows.map((row) => ({ space: toSpace(row.space), memberCount: row.memberCount }));
}

export type NewSpace = {
  slug: string;
  name: string;
  description?: string;
  type: SpaceType;
  visibility: SpaceVisibility;
  metadata?: Record<string, unknown>;
};

export async function insertSpace(input: NewSpace, createdBy: string | null): Promise<Space> {
  try {
    const [row] = await db
      .insert(spaces)
      .values({ ...input, createdBy })
      .returning();
    if (!row) throw new Error("Insertion d'espace sans ligne renvoyée.");
    return toSpace(row);
  } catch (error) {
    return toConflict(error, "Un espace utilise déjà ce slug.");
  }
}

export type SpacePatch = {
  name?: string;
  description?: string | null;
  visibility?: SpaceVisibility;
};

export async function updateSpaceById(id: string, patch: SpacePatch): Promise<Space | null> {
  const [row] = await db.update(spaces).set(patch).where(eq(spaces.id, id)).returning();
  return row ? toSpace(row) : null;
}

// Archivage réversible : on renseigne `archived_at`, on ne supprime rien.
export async function archiveSpaceById(id: string): Promise<boolean> {
  const [row] = await db
    .update(spaces)
    .set({ archivedAt: new Date() })
    .where(sql`${spaces.id} = ${id} and ${spaces.archivedAt} is null`)
    .returning({ id: spaces.id });
  return Boolean(row);
}
