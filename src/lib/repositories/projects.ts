import {
  and,
  desc,
  eq,
  inArray,
  lt,
  or,
  sql,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db/client";
import { projectSkills, projects, skills } from "@/db/schema";
import type { Project, Skill } from "@/lib/types";
import type { Cursor } from "@/lib/pagination";

type ProjectRow = typeof projects.$inferSelect;

// Couche données du module projets (F05/F06) : seule à parler SQL/Drizzle.
// Aucune règle métier ici, uniquement des requêtes et le mapping ligne → entité.

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    authorId: row.authorId,
    title: row.title,
    body: row.body,
    coverKey: row.coverKey,
    status: row.status,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Comparaison de tuple `(date, id) < (cursor.date, cursor.id)` : pagination par
// curseur stable, jamais d'OFFSET (F07 règle 3).
function afterTuple<TSort extends AnyColumn, TId extends AnyColumn>(
  sortColumn: TSort,
  idColumn: TId,
  cursor: Cursor,
): SQL {
  return or(
    lt(sortColumn, cursor.sortAt),
    and(eq(sortColumn, cursor.sortAt), lt(idColumn, cursor.id)),
  ) as SQL;
}

export type NewProject = {
  authorId: string;
  title: string;
  body: string;
  coverKey?: string | null;
};

export async function insertProject(input: NewProject): Promise<Project> {
  const [row] = await db.insert(projects).values(input).returning();
  if (!row) throw new Error("Insertion de projet sans ligne renvoyée.");
  return toProject(row);
}

export async function findOwnedProjectById(
  id: string,
  authorId: string,
): Promise<Project | null> {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.authorId, authorId)))
    .limit(1);
  return row ? toProject(row) : null;
}

// Un brouillon n'est visible que de son auteur ; un projet publié est visible de
// tous les membres connectés. Le filtre vit dans le SQL (F05/F07 règle 5).
export async function findVisibleProjectById(
  id: string,
  viewerProfileId: string | null,
): Promise<Project | null> {
  const visibility: SQL = viewerProfileId
    ? (or(eq(projects.status, "published"), eq(projects.authorId, viewerProfileId)) as SQL)
    : eq(projects.status, "published");
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), visibility))
    .limit(1);
  return row ? toProject(row) : null;
}

export type ProjectPatch = {
  title?: string;
  body?: string;
  coverKey?: string | null;
};

export async function updateOwnedProject(
  id: string,
  authorId: string,
  patch: ProjectPatch,
): Promise<Project | null> {
  const [row] = await db
    .update(projects)
    .set(patch)
    .where(and(eq(projects.id, id), eq(projects.authorId, authorId)))
    .returning();
  return row ? toProject(row) : null;
}

export async function deleteOwnedProject(id: string, authorId: string): Promise<boolean> {
  const rows = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.authorId, authorId)))
    .returning({ id: projects.id });
  return rows.length > 0;
}

export async function markProjectPublished(
  id: string,
  authorId: string,
  publishedAt: Date,
): Promise<Project | null> {
  const [row] = await db
    .update(projects)
    .set({ status: "published", publishedAt })
    .where(and(eq(projects.id, id), eq(projects.authorId, authorId)))
    .returning();
  return row ? toProject(row) : null;
}

export async function markProjectUnpublished(
  id: string,
  authorId: string,
): Promise<Project | null> {
  const [row] = await db
    .update(projects)
    .set({ status: "draft", publishedAt: null })
    .where(and(eq(projects.id, id), eq(projects.authorId, authorId)))
    .returning();
  return row ? toProject(row) : null;
}

// Remplace les étiquettes d'un projet (transaction : jamais de liste partielle).
export async function replaceProjectSkills(
  projectId: string,
  skillIds: string[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(projectSkills).where(eq(projectSkills.projectId, projectId));
    if (skillIds.length > 0) {
      await tx
        .insert(projectSkills)
        .values(skillIds.map((skillId) => ({ projectId, skillId })))
        .onConflictDoNothing();
    }
  });
}

// Compétences d'un projet (une requête).
export async function listProjectSkills(projectId: string): Promise<Skill[]> {
  const rows = await db
    .select({ id: skills.id, slug: skills.slug, name: skills.name })
    .from(projectSkills)
    .innerJoin(skills, eq(skills.id, projectSkills.skillId))
    .where(eq(projectSkills.projectId, projectId))
    .orderBy(sql`${skills.name} asc`);
  return rows;
}

// DataLoader : compétences de plusieurs projets en une requête (anti N+1).
export async function listProjectSkillsForProjects(
  projectIds: string[],
): Promise<{ projectId: string; id: string; slug: string; name: string }[]> {
  if (projectIds.length === 0) return [];
  return db
    .select({
      projectId: projectSkills.projectId,
      id: skills.id,
      slug: skills.slug,
      name: skills.name,
    })
    .from(projectSkills)
    .innerJoin(skills, eq(skills.id, projectSkills.skillId))
    .where(inArray(projectSkills.projectId, projectIds))
    .orderBy(sql`${skills.name} asc`);
}

export async function listProjectsByAuthor(
  authorId: string,
  limit: number,
  cursor?: Cursor,
): Promise<Project[]> {
  const conditions: SQL[] = [eq(projects.authorId, authorId)];
  if (cursor) conditions.push(afterTuple(projects.updatedAt, projects.id, cursor));
  const rows = await db
    .select()
    .from(projects)
    .where(and(...conditions))
    .orderBy(desc(projects.updatedAt), desc(projects.id))
    .limit(limit);
  return rows.map(toProject);
}

export type PublishedProjectsFilter = {
  limit: number;
  cursor?: Cursor;
  skillSlug?: string;
  authorUsername?: string;
};

export async function listPublishedProjects(
  filter: PublishedProjectsFilter,
): Promise<Project[]> {
  const conditions: SQL[] = [eq(projects.status, "published")];
  if (filter.cursor) conditions.push(afterTuple(projects.publishedAt, projects.id, filter.cursor));
  if (filter.skillSlug) {
    conditions.push(
      sql`exists (select 1 from ${projectSkills} ps join ${skills} s on s.id = ps.skill_id
          where ps.project_id = ${projects.id} and s.slug = ${filter.skillSlug})`,
    );
  }
  if (filter.authorUsername) {
    conditions.push(
      sql`exists (select 1 from profiles pr where pr.id = ${projects.authorId}
          and pr.username = ${filter.authorUsername})`,
    );
  }
  const rows = await db
    .select()
    .from(projects)
    .where(and(...conditions))
    .orderBy(desc(projects.publishedAt), desc(projects.id))
    .limit(filter.limit);
  return rows.map(toProject);
}

// Recalcule le niveau de preuve des compétences d'un profil (proof-model) :
// `demonstrated` si au moins un projet PUBLIÉ de l'auteur porte la compétence,
// sinon `declared`. Appelé après publication, dépublication, suppression ou
// modification des étiquettes.
export async function recomputeProofLevelsForProfile(profileId: string): Promise<void> {
  await db.execute(sql`
    update user_skills us
    set proof_level = case
      when exists (
        select 1 from project_skills ps
        join projects p on p.id = ps.project_id
        where ps.skill_id = us.skill_id
          and p.author_id = us.profile_id
          and p.status = 'published'
      ) then 'demonstrated'::proof_level
      else 'declared'::proof_level
    end
    where us.profile_id = ${profileId}
  `);
}
