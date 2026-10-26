import { z } from "zod";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import type { UseCaseContext, ViewerContext } from "@/lib/context";
import {
  countPostLikes,
  deleteCommentById,
  deletePostById,
  deletePostLike,
  findCommentById,
  findPostById,
  insertComment,
  insertPost,
  insertPostLike,
  isPostLikedByProfile,
  listPosts as repoListPosts,
  listPostsByAuthor as repoListPostsByAuthor,
  updatePostById,
  type PostsCursor,
} from "@/lib/repositories/posts";
import type { Post, PostComment } from "@/lib/types";
import { postImageKeySchema } from "@/lib/validation/post";
import { postImagePrefix } from "@/lib/storage";

// Schémas partagés des posts et commentaires (F11). Les mêmes contraintes
// servent au GraphQL et au formulaire client. Texte brut : pas de HTML.

export const MAX_POST_BODY = 5000;
export const MAX_COMMENT_BODY = 1000;

const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Identifiant invalide.",
  );

const postBodySchema = z
  .string()
  .trim()
  .min(1, "Le post ne peut pas être vide.")
  .max(MAX_POST_BODY, `Texte trop long (${MAX_POST_BODY} caractères maximum).`)
  .refine((value) => !/[<>]/.test(value), "Le texte contient des caractères interdits.");

const commentBodySchema = z
  .string()
  .trim()
  .min(1, "Le commentaire ne peut pas être vide.")
  .max(MAX_COMMENT_BODY, `Texte trop long (${MAX_COMMENT_BODY} caractères maximum).`)
  .refine((value) => !/[<>]/.test(value), "Le texte contient des caractères interdits.");

export const createPostSchema = z
  .object({
    body: postBodySchema,
    imageKey: postImageKeySchema.nullable().optional(),
  })
  .strict();
export const updatePostSchema = z
  .object({
    id: uuidSchema,
    body: postBodySchema,
    // Absent = conserver l'image, null = la retirer, clé = la remplacer.
    imageKey: postImageKeySchema.nullable().optional(),
  })
  .strict();
export const createCommentSchema = z
  .object({
    postId: uuidSchema,
    parentId: uuidSchema.nullable(),
    body: commentBodySchema,
  })
  .strict();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export type PostLikeResult = {
  postId: string;
  likeCount: number;
  hasLiked: boolean;
};

// Cas d'usage des posts et commentaires (F11). L'auteur est TOUJOURS
// `ctx.profileId` (jamais un identifiant reçu du client) ; la propriété est
// vérifiée ici, pas dans le transport.

export async function createPost(ctx: UseCaseContext, input: CreatePostInput): Promise<Post> {
  // Appartenance de l'image : la clé doit porter le profileId du membre
  // (F12) — sinon un membre pourrait référencer le fichier d'un autre.
  const imageKey = input.imageKey ?? null;
  if (imageKey && !imageKey.startsWith(postImagePrefix(ctx.profileId))) {
    throw new ValidationError("Clé d'image invalide.");
  }
  return insertPost(ctx.profileId, input.body, imageKey);
}

export async function deletePost(ctx: UseCaseContext, id: string): Promise<void> {
  const deleted = await deletePostById(id, ctx.profileId);
  if (!deleted) {
    // Le post n'existe pas ou n'appartient pas au lecteur : NOT_FOUND pour ne
    // pas révéler son existence (api-graphql §5).
    throw new NotFoundError("Post introuvable.");
  }
}

// Édition d'un post : la propriété est vérifiée avant toute écriture.
export async function updatePost(
  ctx: UseCaseContext,
  input: UpdatePostInput,
): Promise<Post> {
  const existing = await findPostById(input.id);
  if (!existing || existing.authorId !== ctx.profileId) {
    throw new NotFoundError("Post introuvable.");
  }
  if (input.imageKey && !input.imageKey.startsWith(postImagePrefix(ctx.profileId))) {
    throw new ValidationError("Clé d'image invalide.");
  }

  const updated = await updatePostById(
    input.id,
    ctx.profileId,
    input.body,
    input.imageKey,
  );
  if (!updated) throw new NotFoundError("Post introuvable.");
  return updated;
}

export async function getOwnPost(ctx: UseCaseContext, id: string): Promise<Post> {
  const post = await findPostById(id);
  if (!post || post.authorId !== ctx.profileId) {
    throw new NotFoundError("Post introuvable.");
  }
  return post;
}

// J'aime / retire un j'aime. Retourne l'état courant pour le client.
export async function togglePostLike(
  ctx: UseCaseContext,
  id: string,
): Promise<PostLikeResult> {
  const post = await findPostById(id);
  if (!post) throw new NotFoundError("Post introuvable.");

  const alreadyLiked = await isPostLikedByProfile(id, ctx.profileId);
  if (alreadyLiked) {
    await deletePostLike(id, ctx.profileId);
  } else {
    await insertPostLike(id, ctx.profileId);
  }

  return {
    postId: id,
    likeCount: await countPostLikes(id),
    hasLiked: !alreadyLiked,
  };
}

export async function getPost(ctx: UseCaseContext, id: string): Promise<Post> {
  const post = await findPostById(id);
  if (!post) throw new NotFoundError("Post introuvable.");
  return post;
}

export async function listPosts(
  ctx: ViewerContext,
  options: { limit: number; after?: string },
): Promise<{ edges: { cursor: string; node: Post }[]; hasNextPage: boolean; endCursor: string | null }> {
  const cursor = options.after ? decodePostsCursor(options.after) : undefined;
  const rows = await repoListPosts(options.limit, cursor);
  const hasNextPage = rows.length > options.limit;
  const pageRows = hasNextPage ? rows.slice(0, options.limit) : rows;
  const edges = pageRows.map((node) => ({
    cursor: encodeCursor({ sortAt: node.createdAt, id: node.id }),
    node,
  }));
  return {
    edges,
    hasNextPage,
    endCursor: edges.at(-1)?.cursor ?? null,
  };
}

// Posts d'un auteur (profil public) : mêmes règles de pagination que le fil.
export async function listPostsByAuthor(
  _ctx: ViewerContext,
  authorId: string,
  options: { limit: number; after?: string },
): Promise<{ edges: { cursor: string; node: Post }[]; hasNextPage: boolean; endCursor: string | null }> {
  const cursor = options.after ? decodePostsCursor(options.after) : undefined;
  const rows = await repoListPostsByAuthor(authorId, options.limit, cursor);
  const hasNextPage = rows.length > options.limit;
  const pageRows = hasNextPage ? rows.slice(0, options.limit) : rows;
  const edges = pageRows.map((node) => ({
    cursor: encodeCursor({ sortAt: node.createdAt, id: node.id }),
    node,
  }));
  return {
    edges,
    hasNextPage,
    endCursor: edges.at(-1)?.cursor ?? null,
  };
}

// Posts de l'auteur connecté : tous les posts (pas de brouillon en V1.5),
// paginés par curseur, pour l'espace de gestion `/me/posts`.
export async function listOwnPosts(
  ctx: UseCaseContext,
  options: { limit: number; after?: string },
): Promise<{ posts: Post[]; hasNextPage: boolean; endCursor: string | null }> {
  const cursor = options.after ? decodePostsCursor(options.after) : undefined;
  const rows = await repoListPostsByAuthor(ctx.profileId, options.limit, cursor);
  const hasNextPage = rows.length > options.limit;
  const pageRows = hasNextPage ? rows.slice(0, options.limit) : rows;
  const edges = pageRows.map((post) => ({
    cursor: encodeCursor({ sortAt: post.createdAt, id: post.id }),
  }));
  return {
    posts: pageRows,
    hasNextPage,
    endCursor: edges.at(-1)?.cursor ?? null,
  };
}

export async function addComment(ctx: UseCaseContext, input: CreateCommentInput): Promise<PostComment> {
  const post = await findPostById(input.postId);
  if (!post) throw new NotFoundError("Post introuvable.");

  if (input.parentId) {
    const parent = await findCommentById(input.parentId);
    if (!parent) throw new NotFoundError("Commentaire introuvable.");
    // Une réponse doit cibler un commentaire du MÊME post.
    if (parent.postId !== input.postId) {
      throw new ValidationError("La réponse ne cible pas le bon post.");
    }
  }

  return insertComment({
    postId: input.postId,
    parentId: input.parentId ?? null,
    authorId: ctx.profileId,
    body: input.body,
  });
}

export async function deleteComment(ctx: UseCaseContext, id: string): Promise<void> {
  const deleted = await deleteCommentById(id, ctx.profileId);
  if (!deleted) {
    throw new NotFoundError("Commentaire introuvable.");
  }
}

// Curseur de pagination des posts : tuple (createdAt, id), même encodage que
// les projets (pagination par curseur, jamais d'OFFSET).
function decodePostsCursor(raw: string): PostsCursor {
  const { sortAt, id } = decodeCursor(raw);
  return { createdAt: sortAt, id };
}