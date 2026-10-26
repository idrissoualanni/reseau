import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { postComments, projectComments, projectFollowers, projectReactions, projectUpdates } from "@/db/schema";
import type { Skill } from "@/lib/types";
import {
  findProfileSummariesByIds,
  type ProfileSummaryRow,
} from "@/lib/repositories/profiles";
import { listProjectSkillsForProjects } from "@/lib/repositories/projects";
import { listCommentsForPosts, type CommentRow } from "@/lib/repositories/posts";
import {
  countProjectFollowersByProjectId,
  countProjectReactionsByProjectId,
  countProjectUpdatesByProjectId,
  findProjectReactionsByProjectId,
  findUserProjectReactions,
  isProjectFollowedByProfile,
  listProjectCommentsByProjectId,
  listProjectCommentRepliesByParentId,
  listProjectFollowersByProjectId,
  listProjectUpdatesByProjectId,
} from "@/lib/repositories/projects";
import { projectReactionTypeValues } from "@/lib/types";
import { decodeCursor, encodeCursor } from "@/lib/pagination";

// DataLoaders d'une requête (graphql.md §6) : une seule requête SQL par lot,
// résultats renvoyés dans l'ordre des clés reçues.

export type ProfileSummary = ProfileSummaryRow;

// V1.5 — Types pour DataLoaders projets
export type ProjectReactionCounts = {
  type: string;
  count: number;
  hasReacted: boolean;
};

export type ProjectCommentWithAuthor = {
  id: string;
  projectId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: ProfileSummary;
  replies: ProjectCommentWithAuthor[];
  depth: number;
};

export type ProjectFollowerWithProfile = {
  projectId: string;
  profileId: string;
  createdAt: Date;
  profile: ProfileSummary;
};

export type ProjectUpdateWithAuthor = {
  id: string;
  projectId: string;
  authorId: string;
  body: string;
  imageKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: ProfileSummary;
};

export type Loaders = {
  authorById: DataLoader<string, ProfileSummary | null>;
  skillsByProjectId: DataLoader<string, Skill[]>;
  commentsByPostId: DataLoader<string, CommentRow[]>;
  repliesByCommentId: DataLoader<string, CommentRow[]>;

  // V1.5 — Projets
  projectReactionsByProjectId: DataLoader<string, ProjectReactionCounts[]>;
  projectCommentsByProjectId: DataLoader<{ projectId: string; first: number; after?: string }, { edges: { cursor: string; node: ProjectCommentWithAuthor }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>;
  projectCommentRepliesByParentId: DataLoader<string, ProjectCommentWithAuthor[]>;
  projectFollowerCountByProjectId: DataLoader<string, number>;
  projectFollowedByProfileId: DataLoader<{ projectId: string; profileId: string }, boolean>;
  projectFollowersByProjectId: DataLoader<{ projectId: string; first: number; after?: string }, { edges: { cursor: string; node: ProjectFollowerWithProfile }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>;
  projectUpdateCountByProjectId: DataLoader<string, number>;
  projectUpdatesByProjectId: DataLoader<{ projectId: string; first: number; after?: string }, { edges: { cursor: string; node: ProjectUpdateWithAuthor }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>;
};

export function createLoaders(): Loaders {
  return {
    authorById: new DataLoader<string, ProfileSummary | null>(async (ids) => {
      const rows = await findProfileSummariesByIds([...ids]);
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.map((id) => byId.get(id) ?? null);
    }),

    skillsByProjectId: new DataLoader<string, Skill[]>(async (projectIds) => {
      const rows = await listProjectSkillsForProjects([...projectIds]);
      const grouped = new Map<string, Skill[]>();
      for (const row of rows) {
        const list = grouped.get(row.projectId) ?? [];
        list.push({ id: row.id, slug: row.slug, name: row.name });
        grouped.set(row.projectId, list);
      }
      return projectIds.map((id) => grouped.get(id) ?? []);
    }),

    commentsByPostId: new DataLoader<string, CommentRow[]>(async (postIds) => {
      const rows = await listCommentsForPosts([...postIds]);
      const grouped = new Map<string, CommentRow[]>();
      for (const row of rows) {
        // `Post.comments` n'expose que les racines ; les réponses vivent sous
        // `PostComment.replies` (sinon une réponse apparaîtrait deux fois).
        if (row.parentId !== null) continue;
        const list = grouped.get(row.postId) ?? [];
        list.push(row);
        grouped.set(row.postId, list);
      }
      return postIds.map((id) => grouped.get(id) ?? []);
    }),

    repliesByCommentId: new DataLoader<string, CommentRow[]>(async (commentIds) => {
      if (commentIds.length === 0) return [];
      // Les réponses sont les commentaires dont parent_id pointe vers un
      // commentaire donné. Une seule requête pour tous les parents.
      const rows = await db
        .select({
          postId: postComments.postId,
          id: postComments.id,
          parentId: postComments.parentId,
          authorId: postComments.authorId,
          body: postComments.body,
          createdAt: postComments.createdAt,
          updatedAt: postComments.updatedAt,
        })
        .from(postComments)
        .where(inArray(postComments.parentId, [...commentIds]));
      const grouped = new Map<string, CommentRow[]>();
      for (const row of rows) {
        const list = grouped.get(row.parentId!) ?? [];
        list.push(row);
        grouped.set(row.parentId!, list);
      }
      return commentIds.map((id) => grouped.get(id) ?? []);
    }),

    // V1.5 — Réactions projet (F19)
    projectReactionsByProjectId: new DataLoader<string, ProjectReactionCounts[]>(async (projectIds) => {
      const results = await Promise.all(
        projectIds.map(async (projectId) => {
          const [reactions, userReactions] = await Promise.all([
            countProjectReactionsByProjectId(projectId),
            // Pour hasReacted, on a besoin du profileId du viewer
            // On le gérera côté résolveur avec un DataLoader séparé
            Promise.resolve(new Map<string, string[]>()),
          ]);
          // Note: hasReacted sera calculé dans le résolveur avec projectFollowedByProfileId
          return projectReactionTypeValues.map((type) => ({
            type,
            count: reactions.get(type) ?? 0,
            hasReacted: false, // Sera surchargé par le résolveur
          }));
        }),
      );
      return results;
    }),

    // V1.5 — Commentaires projet (F19)
    projectCommentsByProjectId: new DataLoader<{ projectId: string; first: number; after?: string }, { edges: { cursor: string; node: ProjectCommentWithAuthor }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>(async (keys) => {
      const results = await Promise.all(
        keys.map(async (key) => {
          const comments = await listProjectCommentsByProjectId(
            key.projectId,
            key.first + 1,
            key.after ? decodeCursor(key.after) : undefined,
          );
          const hasCommentsNextPage = comments.length > key.first;
          const commentsPage = hasCommentsNextPage ? comments.slice(0, key.first) : comments;
          
          // Pour chaque commentaire, charger l'auteur et les réponses
          const commentsWithAuthors = await Promise.all(
            commentsPage.map(async (comment) => {
              const [author] = await findProfileSummariesByIds([comment.authorId]);
              const replies = await listProjectCommentRepliesByParentId(comment.id);
              const repliesWithAuthors = await Promise.all(
                replies.map(async (reply) => {
                  const [replyAuthor] = await findProfileSummariesByIds([reply.authorId]);
                  return {
                    ...reply,
                    author: replyAuthor!,
                    replies: [],
                    depth: 1,
                  } as ProjectCommentWithAuthor;
                })
              );
              return {
                ...comment,
                author: author!,
                replies: repliesWithAuthors,
                depth: 0,
              } as ProjectCommentWithAuthor;
            })
          );

          const edges = commentsWithAuthors.map((node) => ({
            cursor: encodeCursor({ sortAt: node.createdAt, id: node.id }),
            node,
          }));
          return {
            edges,
            pageInfo: {
              hasNextPage: hasCommentsNextPage,
              endCursor: edges.at(-1)?.cursor ?? null,
            },
          };
        }),
      );
      return results;
    }),

    // V1.5 — Réponses aux commentaires projet
    projectCommentRepliesByParentId: new DataLoader<string, ProjectCommentWithAuthor[]>(async (parentIds) => {
      const results = await Promise.all(
        parentIds.map(async (parentId) => {
          const replies = await listProjectCommentRepliesByParentId(parentId);
          return Promise.all(
            replies.map(async (reply) => {
              const [author] = await findProfileSummariesByIds([reply.authorId]);
              return {
                ...reply,
                author: author!,
                replies: [],
                depth: 1,
              } as ProjectCommentWithAuthor;
            })
          );
        })
      );
      return results;
    }),

    // V1.5 — Suiveurs projet (F19)
    projectFollowerCountByProjectId: new DataLoader<string, number>(async (projectIds) => {
      return Promise.all(projectIds.map(countProjectFollowersByProjectId));
    }),

    projectFollowedByProfileId: new DataLoader<{ projectId: string; profileId: string }, boolean>(async (keys) => {
      return Promise.all(keys.map((k) => isProjectFollowedByProfile(k.projectId, k.profileId)));
    }),

    projectFollowersByProjectId: new DataLoader<{ projectId: string; first: number; after?: string }, { edges: { cursor: string; node: ProjectFollowerWithProfile }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>(async (keys) => {
      const results = await Promise.all(
        keys.map(async (key) => {
          const followers = await listProjectFollowersByProjectId(
            key.projectId,
            key.first + 1,
            key.after ? decodeCursor(key.after) : undefined,
          );
          const hasFollowersNextPage = followers.length > key.first;
          const followersPage = hasFollowersNextPage ? followers.slice(0, key.first) : followers;

          const followersWithProfiles = await Promise.all(
            followersPage.map(async (follower) => {
              const [profile] = await findProfileSummariesByIds([follower.profileId]);
              return {
                ...follower,
                profile: profile!,
              } as ProjectFollowerWithProfile;
            })
          );

          const edges = followersWithProfiles.map((node) => ({
            cursor: encodeCursor({ sortAt: node.createdAt, id: node.profileId }),
            node,
          }));
          return {
            edges,
            pageInfo: {
              hasNextPage: hasFollowersNextPage,
              endCursor: edges.at(-1)?.cursor ?? null,
            },
          };
        })
      );
      return results;
    }),

    // V1.5 — Updates projet (F20)
    projectUpdateCountByProjectId: new DataLoader<string, number>(async (projectIds) => {
      return Promise.all(projectIds.map(countProjectUpdatesByProjectId));
    }),

    projectUpdatesByProjectId: new DataLoader<{ projectId: string; first: number; after?: string }, { edges: { cursor: string; node: ProjectUpdateWithAuthor }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>(async (keys) => {
      const results = await Promise.all(
        keys.map(async (key) => {
          const updates = await listProjectUpdatesByProjectId(
            key.projectId,
            key.first + 1,
            key.after ? decodeCursor(key.after) : undefined,
          );
          const hasUpdatesNextPage = updates.length > key.first;
          const updatesPage = hasUpdatesNextPage ? updates.slice(0, key.first) : updates;

          const updatesWithAuthors = await Promise.all(
            updatesPage.map(async (update) => {
              const [author] = await findProfileSummariesByIds([update.authorId]);
              return {
                ...update,
                author: author!,
              } as ProjectUpdateWithAuthor;
            })
          );

          const edges = updatesWithAuthors.map((node) => ({
            cursor: encodeCursor({ sortAt: node.createdAt, id: node.id }),
            node,
          }));
          return {
            edges,
            pageInfo: {
              hasNextPage: hasUpdatesNextPage,
              endCursor: edges.at(-1)?.cursor ?? null,
            },
          };
        })
      );
      return results;
    }),
  };
}
