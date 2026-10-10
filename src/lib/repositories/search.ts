import { and, desc, eq, lt, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles, projectSkills, projects, skills, userSkills } from "@/db/schema";
import type { ProofLevel } from "@/lib/types";

// Recherche d'étudiants par compétence (F09). Une seule requête avec jointure
// et comptage des projets publiés portant la compétence ; tri multi-critères
// (demonstrated d'abord, puis nb de projets décroissant, puis inscription
// récente, puis id) et pagination par curseur tuple — jamais d'OFFSET.

export type StudentSearchResult = {
  id: string;
  username: string;
  displayName: string;
  schoolName: string | null;
  fieldOfStudy: string | null;
  avatarKey: string | null;
  createdAt: Date;
  proofLevel: ProofLevel;
  projectCount: number;
};

// Tuple de tri complet : (proofRank, projectCount, createdAt, id). Le curseur
// encode ce tuple pour une pagination stable sans OFFSET.
export type SearchCursor = {
  proofRank: number;
  projectCount: number;
  createdAt: Date;
  id: string;
};

export function toSearchCursor(row: StudentSearchResult): SearchCursor {
  return {
    proofRank: row.proofLevel === "demonstrated" ? 0 : 1,
    projectCount: row.projectCount,
    createdAt: row.createdAt,
    id: row.id,
  };
}

export async function searchStudentsBySkill(
  skillId: string,
  limit: number,
  cursor?: SearchCursor,
): Promise<StudentSearchResult[]> {
  // Rang de preuve : 0 = demonstrated (en premier), 1 = declared.
  const proofRank = sql<number>`CASE WHEN ${userSkills.proofLevel} = 'demonstrated' THEN 0 ELSE 1 END`;
  // Nombre de projets publiés du profil portant cette compétence.
  const projectCount = sql<number>`(
    SELECT count(*)::int
    FROM ${projectSkills} AS ps
    INNER JOIN ${projects} AS pr ON pr.id = ps.project_id
    WHERE ps.skill_id = ${userSkills.skillId}
      AND pr.author_id = ${profiles.id}
      AND pr.status = 'published'
  )`;

  const conditions: SQL[] = [eq(userSkills.skillId, skillId)];
  if (cursor) {
    // Tuple (proofRank ASC, projectCount DESC, createdAt DESC, id DESC) :
    // la ligne suit le curseur si elle est "après" dans ce tri.
    conditions.push(
      or(
        sql`${proofRank} > ${cursor.proofRank}`,
        and(
          sql`${proofRank} = ${cursor.proofRank}`,
          sql`${projectCount} < ${cursor.projectCount}`,
        )!,
        and(
          sql`${proofRank} = ${cursor.proofRank}`,
          sql`${projectCount} = ${cursor.projectCount}`,
          lt(profiles.createdAt, cursor.createdAt),
        )!,
        and(
          sql`${proofRank} = ${cursor.proofRank}`,
          sql`${projectCount} = ${cursor.projectCount}`,
          eq(profiles.createdAt, cursor.createdAt),
          lt(profiles.id, cursor.id),
        )!,
      )!,
    );
  }

  const rows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      schoolName: profiles.schoolName,
      fieldOfStudy: profiles.fieldOfStudy,
      avatarKey: profiles.avatarKey,
      createdAt: profiles.createdAt,
      proofLevel: userSkills.proofLevel,
      projectCount,
    })
    .from(userSkills)
    .innerJoin(profiles, eq(profiles.id, userSkills.profileId))
    .where(and(...conditions))
    .orderBy(proofRank, desc(projectCount), desc(profiles.createdAt), desc(profiles.id))
    .limit(limit + 1);

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    schoolName: row.schoolName,
    fieldOfStudy: row.fieldOfStudy,
    avatarKey: row.avatarKey,
    createdAt: row.createdAt,
    proofLevel: row.proofLevel,
    projectCount: row.projectCount,
  }));
}

// Compétence par slug (la recherche normalise l'entrée en slug, F09 règle 7).
export async function findSkillBySlugForSearch(
  slug: string,
): Promise<{ id: string; slug: string; name: string } | null> {
  const [row] = await db
    .select({ id: skills.id, slug: skills.slug, name: skills.name })
    .from(skills)
    .where(eq(skills.slug, slug))
    .limit(1);
  return row ?? null;
}