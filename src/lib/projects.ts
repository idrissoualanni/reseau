import { ForbiddenError, NotFoundError, RuleViolationError } from "@/lib/errors";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import type { UseCaseContext, ViewerContext } from "@/lib/context";
import type { Project, Skill } from "@/lib/types";
import { findOrCreateSkill } from "@/lib/repositories/skills";
import {
  deleteOwnedProject,
  findOwnedProjectById,
  findVisibleProjectById,
  insertProject,
  listProjectSkills,
  listProjectsByAuthor,
  listPublishedProjects as repoListPublished,
  markProjectPublished,
  markProjectUnpublished,
  recomputeProofLevelsForProfile,
  replaceProjectSkills,
  updateOwnedProject,
  type ProjectPatch,
} from "@/lib/repositories/projects";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validation/project";

// Cas d'usage du module projets (F05/F06). L'auteur est TOUJOURS `ctx.profileId`
// (jamais un identifiant reçu du client) ; l'autorisation de propriété est
// vérifiée ici, pas dans le transport.

export type ProjectEdge = { cursor: string; node: Project };
export type ProjectConnectionPage = {
  edges: ProjectEdge[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

function toPage(
  rows: Project[],
  limit: number,
  sortOf: (project: Project) => Date,
): ProjectConnectionPage {
  const hasNextPage = rows.length > limit;
  const pageRows = hasNextPage ? rows.slice(0, limit) : rows;
  const edges = pageRows.map((node) => ({
    cursor: encodeCursor({ sortAt: sortOf(node), id: node.id }),
    node,
  }));
  return {
    edges,
    pageInfo: { hasNextPage, endCursor: edges.at(-1)?.cursor ?? null },
  };
}

function assertCoverOwnership(coverKey: string, profileId: string): void {
  if (!coverKey.startsWith(`projects/${profileId}/`)) {
    throw new ForbiddenError("Cette image n'appartient pas à ton projet.");
  }
}

async function resolveSkillIds(slugs: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const slug of slugs) {
    const skill = await findOrCreateSkill({ slug, name: slug });
    ids.push(skill.id);
  }
  return ids;
}

export async function createProject(
  ctx: UseCaseContext,
  input: CreateProjectInput,
): Promise<Project> {
  if (input.coverKey) assertCoverOwnership(input.coverKey, ctx.profileId);

  const project = await insertProject({
    authorId: ctx.profileId,
    title: input.title,
    body: input.body,
    coverKey: input.coverKey ?? null,
  });

  const skillIds = await resolveSkillIds(input.skillSlugs);
  if (skillIds.length > 0) await replaceProjectSkills(project.id, skillIds);

  return project;
}

export async function updateProject(
  ctx: UseCaseContext,
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const existing = await findOwnedProjectById(id, ctx.profileId);
  if (!existing) throw new NotFoundError("Projet introuvable.");
  if (input.coverKey) assertCoverOwnership(input.coverKey, ctx.profileId);

  const patch: ProjectPatch = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.body !== undefined) patch.body = input.body;
  if (input.coverKey !== undefined) patch.coverKey = input.coverKey;

  const updated = await updateOwnedProject(id, ctx.profileId, patch);
  if (!updated) throw new NotFoundError("Projet introuvable.");

  if (input.skillSlugs !== undefined) {
    await replaceProjectSkills(updated.id, await resolveSkillIds(input.skillSlugs));
    if (updated.status === "published") await recomputeProofLevelsForProfile(ctx.profileId);
  }

  return updated;
}

export async function deleteProject(ctx: UseCaseContext, id: string): Promise<boolean> {
  const existing = await findOwnedProjectById(id, ctx.profileId);
  if (!existing) throw new NotFoundError("Projet introuvable.");

  const deleted = await deleteOwnedProject(id, ctx.profileId);
  if (deleted) await recomputeProofLevelsForProfile(ctx.profileId);
  return deleted;
}

export async function publishProject(
  ctx: UseCaseContext,
  id: string,
  coverKey?: string | null,
): Promise<Project> {
  const project = await findOwnedProjectById(id, ctx.profileId);
  if (!project) throw new NotFoundError("Projet introuvable.");
  if (project.title.trim().length === 0 || project.body.trim().length === 0) {
    throw new RuleViolationError("Titre et texte requis pour publier.");
  }
  if (coverKey) {
    assertCoverOwnership(coverKey, ctx.profileId);
    const withCover = await updateOwnedProject(id, ctx.profileId, { coverKey });
    if (!withCover) throw new NotFoundError("Projet introuvable.");
  }

  const published = await markProjectPublished(id, ctx.profileId, new Date());
  if (!published) throw new NotFoundError("Projet introuvable.");

  await recomputeProofLevelsForProfile(ctx.profileId);
  return published;
}

export async function unpublishProject(ctx: UseCaseContext, id: string): Promise<Project> {
  const project = await findOwnedProjectById(id, ctx.profileId);
  if (!project) throw new NotFoundError("Projet introuvable.");

  const updated = await markProjectUnpublished(id, ctx.profileId);
  if (!updated) throw new NotFoundError("Projet introuvable.");

  await recomputeProofLevelsForProfile(ctx.profileId);
  return updated;
}

export async function getVisibleProject(ctx: ViewerContext, id: string): Promise<Project> {
  const project = await findVisibleProjectById(id, ctx.profileId);
  if (!project) throw new NotFoundError("Projet introuvable.");
  return project;
}

// Projet de l'auteur, quel que soit son statut (édition F05 règle 3).
export async function getOwnProject(
  ctx: UseCaseContext,
  id: string,
): Promise<Project> {
  const project = await findOwnedProjectById(id, ctx.profileId);
  if (!project) throw new NotFoundError("Projet introuvable.");
  return project;
}

export async function getProjectSkills(projectId: string): Promise<Skill[]> {
  return listProjectSkills(projectId);
}

export async function listMyProjects(
  ctx: UseCaseContext,
  limit: number,
  after?: string,
): Promise<ProjectConnectionPage> {
  const cursor = after ? decodeCursor(after) : undefined;
  const rows = await listProjectsByAuthor(ctx.profileId, limit + 1, cursor);
  return toPage(rows, limit, (project) => project.updatedAt);
}

export async function listProjects(
  ctx: ViewerContext,
  options: { limit: number; after?: string; skillSlug?: string; authorUsername?: string },
): Promise<ProjectConnectionPage> {
  const cursor = options.after ? decodeCursor(options.after) : undefined;
  const rows = await repoListPublished({
    limit: options.limit + 1,
    cursor,
    skillSlug: options.skillSlug,
    authorUsername: options.authorUsername,
  });
  return toPage(rows, options.limit, (project) => project.publishedAt ?? project.updatedAt);
}
