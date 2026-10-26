import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { postComments } from "@/db/schema";
import type { Skill } from "@/lib/types";
import {
  findProfileSummariesByIds,
  type ProfileSummaryRow,
} from "@/lib/repositories/profiles";
import { listProjectSkillsForProjects } from "@/lib/repositories/projects";
import {
  countLikesForPosts,
  listCommentsForPosts,
  listLikedPostIds,
  type CommentRow,
} from "@/lib/repositories/posts";
import {
  countProjectFollowersByProjectId,
  countProjectReactionsByProjectId,
  countProjectUpdatesByProjectId,
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
  type: (typeof projectReactionTypeValues)[number];
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
  postLikeCountById: DataLoader<string, number>;
  postLikedByProfile: DataLoader<{ postId: string; profileId: string }, boolean>;

  // V1.5 — Projets
  projectReactionsByProjectId: DataLoader<{ projectId: string; profileId: string | null }, ProjectReactionCounts[]>;
  projectCommentsByProjectId: DataLoader<{ projectId: string; first: number; after?: string }, { edges: { cursor: string; node: ProjectCommentWithAuthor }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>;
  projectCommentRepliesByParentId: DataLoader<string, ProjectCommentWithAuthor[]>;
  projectFollowerCountByProjectId: DataLoader<string, number>;
  projectFollowedByProfileId: DataLoader<{ projectId: string; profileId: string }, boolean>;
  projectFollowersByProjectId: DataLoader<{ projectId: string; first: number; after?: string }, { edges: { cursor: string; node: ProjectFollowerWithProfile }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>;
  projectUpdateCountByProjectId: DataLoader<string, number>;
  projectUpdatesByProjectId: DataLoader<{ projectId: string; first: number; after?: string }, { edges: { cursor: string; node: ProjectUpdateWithAuthor }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>;
};

// Réponses imbriquées d'un commentaire projet : profondeur 3 max (F19).
async function loadProjectCommentReplies(
  parentId: string,
  depth: number,
): Promise<ProjectCommentWithAuthor[]> {
  if (depth > 2) return [];
  const replies = await listProjectCommentRepliesByParentId(parentId);
  return Promise.all(
    replies.map(async (reply) => {
      const [author] = await findProfileSummariesByIds([reply.authorId]);
      return {
        ...reply,
        author: author!,
        replies: await loadProjectCommentReplies(reply.id, depth + 1),
        depth,
      } as ProjectCommentWithAuthor;
    }),
  );
}

export function createLoaders(): Loaders {
  return {
    authorById: new DataLoader<string, ProfileSummary | null>(async (ids) => {
      const rows = await findProfileSummariesByIds([...ids]);
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.map((id) => byId.get(id) ?? null);
    }),

    postLikeCountById: new DataLoader<string, number>(async (postIds) => {
      const counts = await countLikesForPosts([...postIds]);
      return postIds.map((id) => counts.get(id) ?? 0);
    }),

    postLikedByProfile: new DataLoader<{ postId: string; profileId: string }, boolean>(
      async (keys) => {
        const byProfile = new Map<string, string[]>();
        for (const key of keys) {
          const list = byProfile.get(key.profileId) ?? [];
          list.push(key.postId);
          byProfile.set(key.profileId, list);
        }
        const liked = new Map<string, Set<string>>();
        await Promise.all(
          [...byProfile.entries()].map(async ([profileId, postIds]) => {
            liked.set(profileId, await listLikedPostIds(postIds, profileId));
          }),
        );
        return keys.map((key) => liked.get(key.profileId)?.has(key.postId) ?? false);
      },
    ),

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

    // V1.5 — Réactions projet (F19) : la clé porte le viewer pour que
    // `hasReacted` soit réel (jamais codé en dur à false).
    projectReactionsByProjectId: new DataLoader<
      { projectId: string; profileId: string | null },
      ProjectReactionCounts[]
    >(async (keys) => {
      const results = await Promise.all(
        keys.map(async (key) => {
          const [reactions, userReactions] = await Promise.all([
            countProjectReactionsByProjectId(key.projectId),
            key.profileId
              ? findUserProjectReactions(key.projectId, key.profileId)
              : Promise.resolve([]),
          ]);
          const reacted = new Set(userReactions.map((reaction) => reaction.type));
          return projectReactionTypeValues.map((type) => ({
            type,
            count: reactions.get(type) ?? 0,
            hasReacted: reacted.has(type),
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
          const authors = await findProfileSummariesByIds(
            [...new Set(commentsPage.map((comment) => comment.authorId))],
          );
          const authorById = new Map(authors.map((author) => [author.id, author]));

          // Auteurs en un seul lot, puis réponses imbriquées (3 niveaux).
          const commentsWithAuthors = await Promise.all(
            commentsPage.map(async (comment) => ({
              ...comment,
              author: authorById.get(comment.authorId)!,
              replies: await loadProjectCommentReplies(comment.id, 1),
              depth: 0,
            })),
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

    // V1.5 — Réponses aux commentaires projet (3 niveaux, F19)
    projectCommentRepliesByParentId: new DataLoader<string, ProjectCommentWithAuthor[]>(
      async (parentIds) =>
        Promise.all(parentIds.map((parentId) => loadProjectCommentReplies(parentId, 1))),
    ),

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
