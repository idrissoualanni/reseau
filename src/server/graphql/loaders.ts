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
import { listCommentsForPosts, type CommentRow } from "@/lib/repositories/posts";

// DataLoaders d'une requête (graphql.md §6) : une seule requête SQL par lot,
// résultats renvoyés dans l'ordre des clés reçues.

export type ProfileSummary = ProfileSummaryRow;

export type Loaders = {
  authorById: DataLoader<string, ProfileSummary | null>;
  skillsByProjectId: DataLoader<string, Skill[]>;
  commentsByPostId: DataLoader<string, CommentRow[]>;
  repliesByCommentId: DataLoader<string, CommentRow[]>;
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
  };
}
