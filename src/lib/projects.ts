import { ForbiddenError, NotFoundError, RuleViolationError } from "@/lib/errors";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import type { UseCaseContext, ViewerContext } from "@/lib/context";
import type { Project, ProjectComment, ProjectFollower, ProjectReaction, ProjectReactionType, ProjectType, ProjectUpdate, Skill } from "@/lib/types";
import { findOrCreateSkill } from "@/lib/repositories/skills";
import {
  deleteOwnedProject,
  findOwnedProjectById,
  findVisibleProjectById,
  insertProject,
  listProjectSkills,
  listProjectsByAuthor,
  listPublishedProjects as repoListPublished,
  listPublishedProjectsV15,
  markProjectPublished,
  markProjectUnpublished,
  recomputeProofLevelsForProfile,
  replaceProjectSkills,
  updateOwnedProject,
  // V1.5 repositories
  countProjectFollowersByProjectId,
  countProjectReactionsByProjectId,
  countProjectUpdatesByProjectId,
  deleteProjectComment as repoDeleteProjectComment,
  deleteProjectFollower,
  deleteProjectReaction,
  deleteProjectUpdate as repoDeleteProjectUpdate,
  findProjectCommentById,
  findProjectReactionsByProjectId,
  findUserProjectReactions,
  insertProjectComment,
  insertProjectFollower,
  insertProjectReaction,
  insertProjectUpdate,
  isProjectFollowedByProfile,
  listProjectCommentsByProjectId,
  listProjectCommentRepliesByParentId,
  listProjectUpdatesByProjectId,
  type ProjectPatch,
} from "@/lib/repositories/projects";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateProjectCommentInput,
  AddProjectReactionInput,
  CreateProjectUpdateInput,
  ListProjectsQueryInput,
} from "@/lib/validation/project";

// Cas d'usage du module projets (F05/F06/F18/F19/F20). L'auteur est TOUJOURS `ctx.profileId`
// (jamais un identifiant reçu du client) ; l'autorisation de propriété est
// vérifiée ici, pas dans le transport.

export type ProjectEdge = { cursor: string; node: Project };
export type ProjectConnectionPage = {
  edges: ProjectEdge[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

// V1.5 — Types pour les résolveurs GraphQL
export type ProjectReactionCounts = {
  type: ProjectReactionType;
  count: number;
  hasReacted: boolean;
};

export type ProjectCommentWithAuthor = ProjectComment & {
  author: { id: string; username: string; displayName: string; avatarKey: string | null };
  replies: ProjectCommentWithAuthor[];
  depth: number;
};

export type ProjectFollowerWithProfile = ProjectFollower & {
  profile: { id: string; username: string; displayName: string; avatarKey: string | null };
};

export type ProjectUpdateWithAuthor = ProjectUpdate & {
  author: { id: string; username: string; displayName: string; avatarKey: string | null };
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

// ─── V1.5 — Catalogue projets (F18) ──────────────────────────────────────────

export async function listProjectsV15(
  ctx: ViewerContext,
  options: {
    limit: number;
    after?: string;
    skillSlugs?: string[];
    projectTypes?: ProjectType[];
    authorUsername?: string;
    search?: string;
  },
): Promise<ProjectConnectionPage> {
  const cursor = options.after ? decodeCursor(options.after) : undefined;
  const rows = await listPublishedProjectsV15({
    limit: options.limit + 1,
    cursor,
    skillSlugs: options.skillSlugs,
    projectTypes: options.projectTypes,
    authorUsername: options.authorUsername,
    search: options.search,
  });
  return toPage(rows, options.limit, (project) => project.publishedAt ?? project.updatedAt);
}

// ─── V1.5 — Réactions projet (F19) ───────────────────────────────────────────

export async function addProjectReaction(
  ctx: UseCaseContext,
  input: AddProjectReactionInput,
): Promise<ProjectReactionCounts> {
  // Vérifier que le projet existe et est publié
  const project = await findVisibleProjectById(input.projectId, ctx.profileId);
  if (!project || project.status !== "published") {
    throw new ForbiddenError("Ce projet n'est pas publié.");
  }

  const existing = await findUserProjectReactions(input.projectId, ctx.profileId);
  const hasReacted = existing.some((r) => r.type === input.type);

  if (hasReacted) {
    // Toggle off
    await deleteProjectReaction(input.projectId, ctx.profileId, input.type);
  } else {
    // Toggle on
    await insertProjectReaction({
      projectId: input.projectId,
      profileId: ctx.profileId,
      type: input.type,
    });
  }

  // Retourner l'état de la réaction ajoutée
  const counts = await countProjectReactionsByProjectId(input.projectId);
  return {
    type: input.type,
    count: counts.get(input.type) ?? 0,
    hasReacted: true,
  };
}

export async function removeProjectReaction(
  ctx: UseCaseContext,
  projectId: string,
  type: ProjectReactionType,
): Promise<boolean> {
  const project = await findVisibleProjectById(projectId, ctx.profileId);
  if (!project || project.status !== "published") {
    throw new ForbiddenError("Ce projet n'est pas publié.");
  }

  const deleted = await deleteProjectReaction(projectId, ctx.profileId, type);
  return deleted;
}

// ─── V1.5 — Commentaires projet (F19) ────────────────────────────────────────

export async function createProjectComment(
  ctx: UseCaseContext,
  input: CreateProjectCommentInput,
): Promise<ProjectComment> {
  const project = await findVisibleProjectById(input.projectId, ctx.profileId);
  if (!project || project.status !== "published") {
    throw new ForbiddenError("Ce projet n'est pas publié.");
  }

  if (input.parentId) {
    const parent = await findProjectCommentById(input.parentId);
    if (!parent) throw new NotFoundError("Commentaire introuvable.");
    if (parent.projectId !== input.projectId) {
      throw new RuleViolationError("La réponse ne cible pas le bon projet.");
    }
  }

  return insertProjectComment({
    projectId: input.projectId,
    parentId: input.parentId ?? null,
    authorId: ctx.profileId,
    body: input.body,
  });
}

export async function deleteProjectComment(ctx: UseCaseContext, id: string): Promise<void> {
  const deleted = await repoDeleteProjectComment(id, ctx.profileId);
  if (!deleted) {
    throw new NotFoundError("Commentaire introuvable.");
  }
}

// ─── V1.5 — Suivi projet (F19) ───────────────────────────────────────────────

export async function followProject(ctx: UseCaseContext, projectId: string): Promise<boolean> {
  const project = await findVisibleProjectById(projectId, ctx.profileId);
  if (!project || project.status !== "published") {
    throw new ForbiddenError("Ce projet n'est pas publié.");
  }

  await insertProjectFollower({ projectId, profileId: ctx.profileId });
  return true;
}

export async function unfollowProject(ctx: UseCaseContext, projectId: string): Promise<boolean> {
  const project = await findVisibleProjectById(projectId, ctx.profileId);
  if (!project || project.status !== "published") {
    throw new ForbiddenError("Ce projet n'est pas publié.");
  }

  const deleted = await deleteProjectFollower(projectId, ctx.profileId);
  return deleted;
}

// ─── V1.5 — Updates projet (F20) ────────────────────────────────────────────

export async function createProjectUpdate(
  ctx: UseCaseContext,
  input: CreateProjectUpdateInput,
): Promise<ProjectUpdate> {
  const project = await findOwnedProjectById(input.projectId, ctx.profileId);
  if (!project) throw new NotFoundError("Projet introuvable.");

  if (input.imageKey) {
    if (!input.imageKey.startsWith(`projects/${ctx.profileId}/updates/`)) {
      throw new RuleViolationError("Clé d'image invalide.");
    }
  }

  return insertProjectUpdate({
    projectId: input.projectId,
    authorId: ctx.profileId,
    body: input.body,
    imageKey: input.imageKey ?? null,
  });
}

export async function deleteProjectUpdate(ctx: UseCaseContext, id: string): Promise<void> {
  const deleted = await repoDeleteProjectUpdate(id, ctx.profileId);
  if (!deleted) {
    throw new NotFoundError("Mise à jour introuvable.");
  }
}
