import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { skills, userSkills } from "@/db/schema";
import type { ProfileSkill, Skill } from "@/lib/types";

type SkillRow = typeof skills.$inferSelect;

function toSkill(row: SkillRow): Skill {
  return { id: row.id, slug: row.slug, name: row.name };
}

// Autocomplétion : recherche exacte/partielle (ILIKE, index trigramme) puis
// tri par similarité trigramme, la plus proche d'abord (F04). `limit` est
// déjà borné par le schéma d'entrée.
export async function searchSkills(query: string, limit: number): Promise<Skill[]> {
  if (query.length === 0) return [];
  const pattern = `%${query}%`;
  const rows = await db
    .select()
    .from(skills)
    .where(or(ilike(skills.name, pattern), ilike(skills.slug, pattern)))
    .orderBy(sql`similarity(${skills.name}, ${query}) desc`, sql`${skills.name} asc`)
    .limit(limit);
  return rows.map(toSkill);
}

export async function findSkillBySlug(slug: string): Promise<Skill | null> {
  const [row] = await db.select().from(skills).where(eq(skills.slug, slug)).limit(1);
  return row ? toSkill(row) : null;
}

// Référentiel en création libre : on réutilise la compétence existante si le
// slug est déjà connu, sinon on la crée (dédoublonnage par slug, F04 règle 2).
export async function findOrCreateSkill(input: { slug: string; name: string }): Promise<Skill> {
  const [row] = await db
    .insert(skills)
    .values(input)
    .onConflictDoNothing({ target: skills.slug })
    .returning();
  if (row) return toSkill(row);
  const existing = await findSkillBySlug(input.slug);
  if (!existing) throw new Error("Compétence introuvable après insertion.");
  return existing;
}

export async function listSkillsForProfile(profileId: string): Promise<ProfileSkill[]> {
  const rows = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      name: skills.name,
      proofLevel: userSkills.proofLevel,
    })
    .from(userSkills)
    .innerJoin(skills, eq(skills.id, userSkills.skillId))
    .where(eq(userSkills.profileId, profileId))
    .orderBy(sql`${skills.name} asc`);
  return rows;
}

export async function hasSkillForProfile(profileId: string, skillId: string): Promise<boolean> {
  const [row] = await db
    .select({ skillId: userSkills.skillId })
    .from(userSkills)
    .where(and(eq(userSkills.profileId, profileId), eq(userSkills.skillId, skillId)))
    .limit(1);
  return Boolean(row);
}

// Renvoie false si la compétence est déjà portée par le profil.
export async function addSkillToProfile(profileId: string, skillId: string): Promise<boolean> {
  const rows = await db
    .insert(userSkills)
    .values({ profileId, skillId })
    .onConflictDoNothing()
    .returning({ skillId: userSkills.skillId });
  return rows.length > 0;
}

export async function removeSkillFromProfile(profileId: string, skillId: string): Promise<void> {
  await db
    .delete(userSkills)
    .where(and(eq(userSkills.profileId, profileId), eq(userSkills.skillId, skillId)));
}
