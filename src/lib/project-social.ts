import type { UseCaseContext } from "@/lib/context";
import { toAuthorSummary, type AuthorSummary } from "@/lib/api/mappers/profile";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import {
  countProjectFollowersByProjectId,
  isProjectFollowedByProfile,
  listProjectCommentsForProject,
  listProjectFollowersByProjectId,
  listProjectUpdatesByProjectId,
} from "@/lib/repositories/projects";
import { findProfileSummariesByIds } from "@/lib/repositories/profiles";
import { getPublicUrl } from "@/lib/storage";
import {
  listProjectReactionsForViewer,
  type ProjectReactionCounts,
} from "@/lib/projects";
import type { ProjectComment } from "@/lib/types";

// Vues sérialisables des interactions projet (F19/F20) : le serveur ne transmet
// jamais de clé de stockage ni de date non ISO aux composants client.

export type ProjectReactionView = ProjectReactionCounts;

export type ProjectCommentView = {
  id: string;
  projectId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: AuthorSummary;
  replies: ProjectCommentView[];
  depth: number;
};

export type ProjectFollowerView = {
  projectId: string;
  profileId: string;
  createdAt: string;
  profile: AuthorSummary;
};

export type ProjectUpdateView = {
  id: string;
  projectId: string;
  authorId: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: AuthorSummary;
};

export type ProjectFollowerPage = {
  followers: ProjectFollowerView[];
  followerCount: number;
  isFollowed: boolean;
  hasNextPage: boolean;
  endCursor: string | null;
};

export type ProjectUpdatePage = {
  updates: ProjectUpdateView[];
  hasNextPage: boolean;
  endCursor: string | null;
};

export type ProjectSocialData = {
  reactions: ProjectReactionView[];
  comments: ProjectCommentView[];
  followerCount: number;
  isFollowed: boolean;
  followers: ProjectFollowerView[];
  followersHasNextPage: boolean;
  followersEndCursor: string | null;
  updates: ProjectUpdateView[];
  updatesHasNextPage: boolean;
  updatesEndCursor: string | null;
};

export type SocialActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const UNKNOWN_AUTHOR: AuthorSummary = {
  id: "unknown",
  username: "membre-supprime",
  displayName: "Membre supprimé",
  avatarUrl: null,
};

function authorsById(rows: Awaited<ReturnType<typeof findProfileSummariesByIds>>) {
  const map = new Map<string, AuthorSummary>();
  for (const row of rows) {
    const author = toAuthorSummary(row);
    if (author) map.set(row.id, author);
  }
  return map;
}

function authorFor(map: Map<string, AuthorSummary>, id: string): AuthorSummary {
  return map.get(id) ?? { ...UNKNOWN_AUTHOR, id };
}

// Construit l'arbre des commentaires (3 niveaux max, F19) à partir de lignes
// plates. Les racines sont triées du plus récent au plus ancien ; les réponses
// gardent l'ordre chronologique.
export function buildProjectCommentTree(
  rows: ProjectComment[],
  authors: Map<string, AuthorSummary>,
  maxDepth = 3,
): ProjectCommentView[] {
  const byParent = new Map<string | null, ProjectComment[]>();
  for (const row of rows) {
    const list = byParent.get(row.parentId) ?? [];
    list.push(row);
    byParent.set(row.parentId, list);
  }

  const build = (row: ProjectComment, depth: number): ProjectCommentView => {
    const children = depth + 1 < maxDepth ? (byParent.get(row.id) ?? []) : [];
    return {
      id: row.id,
      projectId: row.projectId,
      parentId: row.parentId,
      authorId: row.authorId,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      author: authorFor(authors, row.authorId),
      replies: children.map((child) => build(child, depth + 1)),
      depth,
    };
  };

  const roots = [...(byParent.get(null) ?? [])].sort(
    (left, right) =>
      right.createdAt.getTime() - left.createdAt.getTime() ||
      right.id.localeCompare(left.id),
  );
  return roots.map((root) => build(root, 0));
}

export async function loadProjectComments(projectId: string): Promise<ProjectCommentView[]> {
  const rows = await listProjectCommentsForProject(projectId);
  const authors = authorsById(
    await findProfileSummariesByIds([...new Set(rows.map((row) => row.authorId))]),
  );
  return buildProjectCommentTree(rows, authors);
}

export async function loadProjectReactions(
  ctx: Pick<UseCaseContext, "profileId">,
  projectId: string,
): Promise<ProjectReactionView[]> {
  return listProjectReactionsForViewer(ctx, projectId);
}

export async function loadProjectFollowers(
  ctx: Pick<UseCaseContext, "profileId">,
  projectId: string,
  options: { first?: number; after?: string } = {},
): Promise<ProjectFollowerPage> {
  const first = options.first ?? 20;
  const cursor = options.after ? decodeCursor(options.after) : undefined;
  const [followerCount, isFollowed, rows] = await Promise.all([
    countProjectFollowersByProjectId(projectId),
    isProjectFollowedByProfile(projectId, ctx.profileId),
    listProjectFollowersByProjectId(projectId, first + 1, cursor),
  ]);
  const hasNextPage = rows.length > first;
  const page = hasNextPage ? rows.slice(0, first) : rows;
  const authors = authorsById(
    await findProfileSummariesByIds([...new Set(page.map((row) => row.profileId))]),
  );
  const followers = page.map((row) => ({
    projectId: row.projectId,
    profileId: row.profileId,
    createdAt: row.createdAt.toISOString(),
    profile: authorFor(authors, row.profileId),
  }));
  const last = page.at(-1);
  return {
    followers,
    followerCount,
    isFollowed,
    hasNextPage,
    endCursor: last
      ? encodeCursor({ sortAt: last.createdAt, id: last.profileId })
      : null,
  };
}

export async function loadProjectUpdates(
  projectId: string,
  options: { first?: number; after?: string } = {},
): Promise<ProjectUpdatePage> {
  const first = options.first ?? 20;
  const cursor = options.after ? decodeCursor(options.after) : undefined;
  const rows = await listProjectUpdatesByProjectId(projectId, first + 1, cursor);
  const hasNextPage = rows.length > first;
  const page = hasNextPage ? rows.slice(0, first) : rows;
  const authors = authorsById(
    await findProfileSummariesByIds([...new Set(page.map((row) => row.authorId))]),
  );
  const updates = page.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    authorId: row.authorId,
    body: row.body,
    imageUrl: row.imageKey ? getPublicUrl(row.imageKey) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    author: authorFor(authors, row.authorId),
  }));
  const last = page.at(-1);
  return {
    updates,
    hasNextPage,
    endCursor: last
      ? encodeCursor({ sortAt: last.createdAt, id: last.id })
      : null,
  };
}

// Charge tout ce dont la page projet a besoin en un seul passage serveur.
export async function loadProjectSocial(
  ctx: UseCaseContext,
  projectId: string,
): Promise<ProjectSocialData> {
  const [reactions, comments, followers, updates] = await Promise.all([
    loadProjectReactions(ctx, projectId),
    loadProjectComments(projectId),
    loadProjectFollowers(ctx, projectId),
    loadProjectUpdates(projectId),
  ]);

  return {
    reactions,
    comments,
    followerCount: followers.followerCount,
    isFollowed: followers.isFollowed,
    followers: followers.followers,
    followersHasNextPage: followers.hasNextPage,
    followersEndCursor: followers.endCursor,
    updates: updates.updates,
    updatesHasNextPage: updates.hasNextPage,
    updatesEndCursor: updates.endCursor,
  };
}
