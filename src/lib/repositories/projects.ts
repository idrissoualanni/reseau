import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  or,
  sql,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db/client";
import {
  projectComments,
  projectFollowers,
  projectReactions,
  projectSkills,
  projects,
  projectUpdates,
  profiles,
  skills,
} from "@/db/schema";
import type { Project, ProjectComment, ProjectFollower, ProjectReaction, ProjectReactionType, ProjectType, ProjectUpdate, Skill } from "@/lib/types";
import type { Cursor } from "@/lib/pagination";

type ProjectRow = typeof projects.$inferSelect;
type ProjectCommentRow = typeof projectComments.$inferSelect;
type ProjectFollowerRow = typeof projectFollowers.$inferSelect;
type ProjectReactionRow = typeof projectReactions.$inferSelect;
type ProjectUpdateRow = typeof projectUpdates.$inferSelect;

// Couche données du module projets (F05/F06/F18/F19/F20) : seule à parler SQL/Drizzle.
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
    type: row.type as ProjectType,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toProjectComment(row: ProjectCommentRow): ProjectComment {
  return {
    id: row.id,
    projectId: row.projectId,
    parentId: row.parentId,
    authorId: row.authorId,
    body: row.body,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toProjectFollower(row: ProjectFollowerRow): ProjectFollower {
  return {
    projectId: row.projectId,
    profileId: row.profileId,
    createdAt: row.createdAt,
  };
}

function toProjectReaction(row: ProjectReactionRow): ProjectReaction {
  return {
    projectId: row.projectId,
    profileId: row.profileId,
    type: row.type,
    createdAt: row.createdAt,
  };
}

function toProjectUpdate(row: ProjectUpdateRow): ProjectUpdate {
  return {
    id: row.id,
    projectId: row.projectId,
    authorId: row.authorId,
    body: row.body,
    imageKey: row.imageKey,
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

// ─── V1.5 — Catalogue projets (F18) ──────────────────────────────────────────

export type PublishedProjectsFilterV15 = {
  limit: number;
  cursor?: Cursor;
  skillSlugs?: string[];
  projectTypes?: ProjectType[];
  authorUsername?: string;
  search?: string;
};

export async function listPublishedProjectsV15(
  filter: PublishedProjectsFilterV15,
): Promise<Project[]> {
  const conditions: SQL[] = [eq(projects.status, "published")];

  if (filter.cursor) conditions.push(afterTuple(projects.publishedAt, projects.id, filter.cursor));

  if (filter.skillSlugs && filter.skillSlugs.length > 0) {
    // AND sur toutes les compétences : le projet doit avoir TOUTES les compétences
    for (const slug of filter.skillSlugs) {
      conditions.push(
        sql`exists (select 1 from ${projectSkills} ps join ${skills} s on s.id = ps.skill_id
            where ps.project_id = ${projects.id} and s.slug = ${slug})`,
      );
    }
  }

  if (filter.projectTypes && filter.projectTypes.length > 0) {
    conditions.push(inArray(projects.type, filter.projectTypes));
  }

  if (filter.authorUsername) {
    conditions.push(
      sql`exists (select 1 from profiles pr where pr.id = ${projects.authorId}
          and pr.username = ${filter.authorUsername})`,
    );
  }

  if (filter.search) {
    // Recherche trigramme sur titre + body (F18)
    conditions.push(
      sql`(${projects.title} || ' ' || ${projects.body}) % ${filter.search}`,
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

// ─── V1.5 — Réactions projet (F19) ───────────────────────────────────────────

export type NewProjectReaction = {
  projectId: string;
  profileId: string;
  type: ProjectReactionType;
};

export async function insertProjectReaction(input: NewProjectReaction): Promise<ProjectReaction> {
  const [row] = await db
    .insert(projectReactions)
    .values(input)
    .onConflictDoNothing()
    .returning();
  if (!row) throw new Error("Réaction déjà existante ou insertion échouée.");
  return toProjectReaction(row);
}

export async function deleteProjectReaction(
  projectId: string,
  profileId: string,
  type: ProjectReactionType,
): Promise<boolean> {
  const rows = await db
    .delete(projectReactions)
    .where(
      and(
        eq(projectReactions.projectId, projectId),
        eq(projectReactions.profileId, profileId),
        eq(projectReactions.type, type),
      ),
    )
    .returning({ projectId: projectReactions.projectId });
  return rows.length > 0;
}

export async function findProjectReactionsByProjectId(projectId: string): Promise<ProjectReaction[]> {
  const rows = await db
    .select()
    .from(projectReactions)
    .where(eq(projectReactions.projectId, projectId))
    .orderBy(sql`${projectReactions.type} asc`);
  return rows.map(toProjectReaction);
}

export async function countProjectReactionsByProjectId(projectId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ type: projectReactions.type, count: sql<number>`count(*)` })
    .from(projectReactions)
    .where(eq(projectReactions.projectId, projectId))
    .groupBy(projectReactions.type);
  const map = new Map<string, number>();
  for (const row of rows) map.set(row.type, row.count);
  return map;
}

export async function findUserProjectReactions(
  projectId: string,
  profileId: string,
): Promise<ProjectReaction[]> {
  const rows = await db
    .select()
    .from(projectReactions)
    .where(and(eq(projectReactions.projectId, projectId), eq(projectReactions.profileId, profileId)));
  return rows.map(toProjectReaction);
}

// ─── V1.5 — Commentaires projet (F19) ────────────────────────────────────────

export type NewProjectComment = {
  projectId: string;
  parentId: string | null;
  authorId: string;
  body: string;
};

export async function insertProjectComment(input: NewProjectComment): Promise<ProjectComment> {
  const [row] = await db.insert(projectComments).values(input).returning();
  if (!row) throw new Error("Insertion de commentaire sans ligne renvoyée.");
  return toProjectComment(row);
}

export async function findProjectCommentById(id: string): Promise<ProjectComment | null> {
  const [row] = await db
    .select()
    .from(projectComments)
    .where(eq(projectComments.id, id))
    .limit(1);
  return row ? toProjectComment(row) : null;
}

export async function deleteProjectComment(id: string, authorId: string): Promise<boolean> {
  // Cascade delete géré par la FK ON DELETE CASCADE sur parent_id
  const rows = await db
    .delete(projectComments)
    .where(and(eq(projectComments.id, id), eq(projectComments.authorId, authorId)))
    .returning({ id: projectComments.id });
  return rows.length > 0;
}

export async function listProjectCommentsByProjectId(
  projectId: string,
  limit: number,
  cursor?: Cursor,
): Promise<ProjectComment[]> {
  const conditions: SQL[] = [eq(projectComments.projectId, projectId), isNull(projectComments.parentId)];
  if (cursor) conditions.push(afterTuple(projectComments.createdAt, projectComments.id, cursor));
  const rows = await db
    .select()
    .from(projectComments)
    .where(and(...conditions))
    .orderBy(desc(projectComments.createdAt), desc(projectComments.id))
    .limit(limit);
  return rows.map(toProjectComment);
}

export async function listProjectCommentRepliesByParentId(parentId: string): Promise<ProjectComment[]> {
  const rows = await db
    .select()
    .from(projectComments)
    .where(eq(projectComments.parentId, parentId))
    .orderBy(projectComments.createdAt);
  return rows.map(toProjectComment);
}

// ─── V1.5 — Suiveurs projet (F19) ────────────────────────────────────────────

export type NewProjectFollower = {
  projectId: string;
  profileId: string;
};

export async function insertProjectFollower(input: NewProjectFollower): Promise<ProjectFollower> {
  const [row] = await db
    .insert(projectFollowers)
    .values(input)
    .onConflictDoNothing()
    .returning();
  if (!row) throw new Error("Suivi déjà existant ou insertion échouée.");
  return toProjectFollower(row);
}

export async function deleteProjectFollower(projectId: string, profileId: string): Promise<boolean> {
  const rows = await db
    .delete(projectFollowers)
    .where(and(eq(projectFollowers.projectId, projectId), eq(projectFollowers.profileId, profileId)))
    .returning({ projectId: projectFollowers.projectId });
  return rows.length > 0;
}

export async function listProjectFollowersByProjectId(
  projectId: string,
  limit: number,
  cursor?: Cursor,
): Promise<ProjectFollower[]> {
  const conditions: SQL[] = [eq(projectFollowers.projectId, projectId)];
  if (cursor) conditions.push(afterTuple(projectFollowers.createdAt, projectFollowers.profileId, cursor));
  const rows = await db
    .select()
    .from(projectFollowers)
    .where(and(...conditions))
    .orderBy(desc(projectFollowers.createdAt), desc(projectFollowers.profileId))
    .limit(limit);
  return rows.map(toProjectFollower);
}

export async function countProjectFollowersByProjectId(projectId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projectFollowers)
    .where(eq(projectFollowers.projectId, projectId));
  return row?.count ?? 0;
}

export async function isProjectFollowedByProfile(projectId: string, profileId: string): Promise<boolean> {
  const [row] = await db
    .select({ projectId: projectFollowers.projectId })
    .from(projectFollowers)
    .where(and(eq(projectFollowers.projectId, projectId), eq(projectFollowers.profileId, profileId)))
    .limit(1);
  return !!row;
}

// ─── V1.5 — Updates projet (F20) ────────────────────────────────────────────

export type NewProjectUpdate = {
  projectId: string;
  authorId: string;
  body: string;
  imageKey?: string | null;
};

export async function insertProjectUpdate(input: NewProjectUpdate): Promise<ProjectUpdate> {
  const [row] = await db.insert(projectUpdates).values(input).returning();
  if (!row) throw new Error("Insertion d'update sans ligne renvoyée.");
  return toProjectUpdate(row);
}

export async function findProjectUpdateById(id: string): Promise<ProjectUpdate | null> {
  const [row] = await db
    .select()
    .from(projectUpdates)
    .where(eq(projectUpdates.id, id))
    .limit(1);
  return row ? toProjectUpdate(row) : null;
}

export async function deleteProjectUpdate(id: string, authorId: string): Promise<boolean> {
  const rows = await db
    .delete(projectUpdates)
    .where(and(eq(projectUpdates.id, id), eq(projectUpdates.authorId, authorId)))
    .returning({ id: projectUpdates.id });
  return rows.length > 0;
}

export async function listProjectUpdatesByProjectId(
  projectId: string,
  limit: number,
  cursor?: Cursor,
): Promise<ProjectUpdate[]> {
  const conditions: SQL[] = [eq(projectUpdates.projectId, projectId)];
  if (cursor) conditions.push(afterTuple(projectUpdates.createdAt, projectUpdates.id, cursor));
  const rows = await db
    .select()
    .from(projectUpdates)
    .where(and(...conditions))
    .orderBy(desc(projectUpdates.createdAt), desc(projectUpdates.id))
    .limit(limit);
  return rows.map(toProjectUpdate);
}

export async function countProjectUpdatesByProjectId(projectId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projectUpdates)
    .where(eq(projectUpdates.projectId, projectId));
  return row?.count ?? 0;
}
