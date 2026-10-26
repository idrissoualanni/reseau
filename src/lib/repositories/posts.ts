import { and, desc, eq, inArray, lt, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { postComments, postLikes, posts } from "@/db/schema";
import type { Post, PostComment } from "@/lib/types";

// Repository des posts et commentaires (F11). Les suppressions en cascade
// (post → commentaires, commentaire → réponses) sont gérées par les FK
// `ON DELETE CASCADE` en base, pas ici.

export async function insertPost(authorId: string, body: string, imageKey: string | null): Promise<Post> {
  const [row] = await db.insert(posts).values({ authorId, body, imageKey }).returning();
  return row;
}

export async function findPostById(id: string): Promise<Post | null> {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}

// Curseur de pagination : tuple (createdAt, id). Le curseur encode ce tuple
// pour une pagination stable sans OFFSET.
export type PostsCursor = { createdAt: Date; id: string };

export async function listPosts(limit: number, cursor?: PostsCursor): Promise<Post[]> {
  const conditions: SQL[] = [];
  if (cursor) {
    // Tri (createdAt DESC, id DESC) : la ligne suit le curseur si elle est
    // "avant" dans ce tri (plus récente d'abord).
    conditions.push(
      or(
        lt(posts.createdAt, cursor.createdAt),
        and(eq(posts.createdAt, cursor.createdAt), lt(posts.id, cursor.id))!,
      )!,
    );
  }
  const rows = await db
    .select()
    .from(posts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1);
  return rows;
}

export async function updatePostById(
  id: string,
  authorId: string,
  body: string,
  imageKey?: string | null,
): Promise<Post | null> {
  const patch: { body: string; updatedAt: Date; imageKey?: string | null } = {
    body,
    updatedAt: new Date(),
  };
  if (imageKey !== undefined) patch.imageKey = imageKey;
  const [row] = await db
    .update(posts)
    .set(patch)
    .where(and(eq(posts.id, id), eq(posts.authorId, authorId)))
    .returning();
  return row ?? null;
}

// Posts d'un auteur, quel que soit leur état de publication (F11) : utilisé
// par l'espace de gestion `/me/posts`.
export async function listPostsByAuthor(
  authorId: string,
  limit: number,
  cursor?: PostsCursor,
): Promise<Post[]> {
  const conditions: SQL[] = [eq(posts.authorId, authorId)];
  if (cursor) {
    conditions.push(
      or(
        lt(posts.createdAt, cursor.createdAt),
        and(eq(posts.createdAt, cursor.createdAt), lt(posts.id, cursor.id))!,
      )!,
    );
  }
  return db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1);
}

export async function deletePostById(id: string, authorId: string): Promise<boolean> {
  const rows = await db
    .delete(posts)
    .where(and(eq(posts.id, id), eq(posts.authorId, authorId)))
    .returning({ id: posts.id });
  return rows.length > 0;
}

export async function insertComment(input: {
  postId: string;
  parentId: string | null;
  authorId: string;
  body: string;
}): Promise<PostComment> {
  const [row] = await db.insert(postComments).values(input).returning();
  return row;
}

export async function findCommentById(id: string): Promise<PostComment | null> {
  const [row] = await db.select().from(postComments).where(eq(postComments.id, id)).limit(1);
  return row ?? null;
}

export async function deleteCommentById(id: string, authorId: string): Promise<boolean> {
  const rows = await db
    .delete(postComments)
    .where(and(eq(postComments.id, id), eq(postComments.authorId, authorId)))
    .returning({ id: postComments.id });
  return rows.length > 0;
}

// Commentaires de plusieurs posts en une requête (anti N+1), triés par
// création décroissante (plus récents d'abord).
export type CommentRow = {
  postId: string;
  id: string;
  parentId: string | null;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function listCommentsForPosts(postIds: string[]): Promise<CommentRow[]> {
  if (postIds.length === 0) return [];
  return db
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
    .where(inArray(postComments.postId, postIds))
    .orderBy(desc(postComments.createdAt), desc(postComments.id));
}

export async function countCommentsForPosts(postIds: string[]): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const rows = await db
    .select({ postId: postComments.postId, count: sql<number>`count(*)::int` })
    .from(postComments)
    .where(inArray(postComments.postId, postIds))
    .groupBy(postComments.postId);
  return new Map(rows.map((row) => [row.postId, row.count]));
}

// ─── V1.5 — J'aime des posts (F11) ──────────────────────────────────────────

export async function insertPostLike(postId: string, profileId: string): Promise<void> {
  await db.insert(postLikes).values({ postId, profileId }).onConflictDoNothing();
}

export async function deletePostLike(postId: string, profileId: string): Promise<boolean> {
  const rows = await db
    .delete(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.profileId, profileId)))
    .returning({ postId: postLikes.postId });
  return rows.length > 0;
}

export async function countLikesForPosts(postIds: string[]): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const rows = await db
    .select({ postId: postLikes.postId, count: sql<number>`count(*)::int` })
    .from(postLikes)
    .where(inArray(postLikes.postId, postIds))
    .groupBy(postLikes.postId);
  return new Map(rows.map((row) => [row.postId, row.count]));
}

// Sous-ensemble des posts déjà aimés par un membre, en une requête.
export async function listLikedPostIds(
  postIds: string[],
  profileId: string | null,
): Promise<Set<string>> {
  if (!profileId || postIds.length === 0) return new Set();
  const rows = await db
    .select({ postId: postLikes.postId })
    .from(postLikes)
    .where(and(inArray(postLikes.postId, postIds), eq(postLikes.profileId, profileId)));
  return new Set(rows.map((row) => row.postId));
}

export async function countPostLikes(postId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postLikes)
    .where(eq(postLikes.postId, postId));
  return row?.count ?? 0;
}

export async function isPostLikedByProfile(
  postId: string,
  profileId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ postId: postLikes.postId })
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.profileId, profileId)))
    .limit(1);
  return Boolean(row);
}