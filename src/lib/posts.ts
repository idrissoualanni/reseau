import { z } from "zod";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import type { UseCaseContext } from "@/lib/context";
import {
  deleteCommentById,
  deletePostById,
  findCommentById,
  findPostById,
  insertComment,
  insertPost,
  listPosts as repoListPosts,
  type PostsCursor,
} from "@/lib/repositories/posts";
import type { Post, PostComment } from "@/lib/types";

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

export const createPostSchema = z.object({ body: postBodySchema }).strict();
export const createCommentSchema = z
  .object({
    postId: uuidSchema,
    parentId: uuidSchema.nullable(),
    body: commentBodySchema,
  })
  .strict();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// Cas d'usage des posts et commentaires (F11). L'auteur est TOUJOURS
// `ctx.profileId` (jamais un identifiant reçu du client) ; la propriété est
// vérifiée ici, pas dans le transport.

export async function createPost(ctx: UseCaseContext, input: CreatePostInput): Promise<Post> {
  return insertPost(ctx.profileId, input.body);
}

export async function deletePost(ctx: UseCaseContext, id: string): Promise<void> {
  const deleted = await deletePostById(id, ctx.profileId);
  if (!deleted) {
    // Le post n'existe pas ou n'appartient pas au lecteur : NOT_FOUND pour ne
    // pas révéler son existence (api-graphql §5).
    throw new NotFoundError("Post introuvable.");
  }
}

export async function getPost(ctx: UseCaseContext, id: string): Promise<Post> {
  const post = await findPostById(id);
  if (!post) throw new NotFoundError("Post introuvable.");
  return post;
}

export async function listPosts(
  ctx: UseCaseContext,
  options: { limit: number; after?: string },
): Promise<{ edges: { cursor: string; node: Post }[]; hasNextPage: boolean; endCursor: string | null }> {
  const cursor = options.after ? decodePostsCursor(options.after) : undefined;
  const rows = await repoListPosts(options.limit, cursor);
  const hasNextPage = rows.length === options.limit;
  const pageRows = hasNextPage ? rows : rows;
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