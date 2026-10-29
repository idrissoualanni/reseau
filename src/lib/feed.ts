import { galleryUrls, getPublicUrl } from "@/lib/storage";
import type { ViewerContext } from "@/lib/context";
import { listProjects } from "@/lib/projects";
import { findProfileSummariesByIds } from "@/lib/repositories/profiles";
import {
  countProjectCommentsForProjects,
  countProjectFollowersForProjects,
  countProjectReactionsForProjects,
  listProjectSkillsForProjects,
} from "@/lib/repositories/projects";
import { toAuthorSummary, type AuthorSummary } from "@/lib/api/mappers/profile";
import type { Project, Skill } from "@/lib/types";

// Assemblage du fil (F07) : une page de projets publiés + leurs compétences et
// auteurs, chargés par lots (jamais de N+1). Les dates sont sérialisées en ISO
// pour passer les frontières page serveur → action serveur → composant client.

export type FeedProject = {
  id: string;
  title: string;
  body: string;
  excerpt: string;
  coverUrl: string | null;
  imageUrls: string[];
  publishedAt: string | null;
  authorId: string;
  reactionCount: number;
  commentCount: number;
  followerCount: number;
};

export type FeedEdge = {
  cursor: string;
  project: FeedProject;
  skills: Skill[];
  author: AuthorSummary | null;
};

export type FeedPage = {
  edges: FeedEdge[];
  hasNextPage: boolean;
  endCursor: string | null;
};

export type FeedOptions = {
  limit: number;
  after?: string;
  skillSlug?: string;
  authorUsername?: string;
};

function excerptOf(body: string, max = 160): string {
  const trimmed = body.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

function toFeedProject(
  project: Project,
  counts?: { reactions: number; comments: number; followers: number },
): FeedProject {
  return {
    id: project.id,
    title: project.title,
    body: project.body,
    excerpt: excerptOf(project.body),
    coverUrl: project.coverKey ? getPublicUrl(project.coverKey) : null,
    imageUrls: galleryUrls(project.coverKey, project.imageKeys),
    publishedAt: project.publishedAt?.toISOString() ?? null,
    authorId: project.authorId,
    reactionCount: counts?.reactions ?? 0,
    commentCount: counts?.comments ?? 0,
    followerCount: counts?.followers ?? 0,
  };
}

export function projectCountsOf(
  projectId: string,
  maps: {
    reactions: Map<string, number>;
    comments: Map<string, number>;
    followers: Map<string, number>;
  },
) {
  return {
    reactions: maps.reactions.get(projectId) ?? 0,
    comments: maps.comments.get(projectId) ?? 0,
    followers: maps.followers.get(projectId) ?? 0,
  };
}

export async function loadProjectsFeed(
  ctx: ViewerContext,
  options: FeedOptions,
): Promise<FeedPage> {
  const page = await listProjects(ctx, options);

  const projectIds = page.edges.map((edge) => edge.node.id);
  if (projectIds.length === 0) {
    return { edges: [], hasNextPage: false, endCursor: null };
  }

  const [skillRows, authorRows, reactionCounts, commentCounts, followerCounts] =
    await Promise.all([
      listProjectSkillsForProjects(projectIds),
      findProfileSummariesByIds(page.edges.map((edge) => edge.node.authorId)),
      countProjectReactionsForProjects(projectIds),
      countProjectCommentsForProjects(projectIds),
      countProjectFollowersForProjects(projectIds),
    ]);

  const skillsByProject = new Map<string, Skill[]>();
  for (const row of skillRows) {
    const list = skillsByProject.get(row.projectId) ?? [];
    list.push({ id: row.id, slug: row.slug, name: row.name });
    skillsByProject.set(row.projectId, list);
  }
  const authorById = new Map(authorRows.map((row) => [row.id, row]));

  const edges = page.edges.map((edge) => ({
    cursor: edge.cursor,
    project: toFeedProject(
      edge.node,
      projectCountsOf(edge.node.id, {
        reactions: reactionCounts,
        comments: commentCounts,
        followers: followerCounts,
      }),
    ),
    skills: skillsByProject.get(edge.node.id) ?? [],
    author: toAuthorSummary(authorById.get(edge.node.authorId) ?? null),
  }));

  return {
    edges,
    hasNextPage: page.pageInfo.hasNextPage,
    endCursor: page.pageInfo.endCursor,
  };
}