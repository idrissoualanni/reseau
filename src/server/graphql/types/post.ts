import { builder } from "@/server/graphql/builder";
import type { Post, PostComment } from "@/lib/types";
import {
  addComment,
  createPost,
  createCommentSchema,
  createPostSchema,
  deleteComment,
  deletePost,
  getPost,
  listPosts,
} from "@/lib/posts";
import { listPostsQuerySchema, postIdSchema } from "@/lib/validation/post";
import { requireProfile, run, validateInput } from "@/server/graphql/errors";
import { PageInfoRef } from "./connection";
import { ProfileSummaryRef } from "./profile";

// Type Post et opérations (F11). Les résolveurs sont fins : contexte,
// validation Zod, puis UN cas d'usage (api-graphql §5).

export const PostRef = builder.objectRef<Post>("Post").implement({
  description: "Post (activité) d'un membre.",
  fields: (t) => ({
    id: t.exposeID("id"),
    body: t.exposeString("body"),
    createdAt: t.field({ type: "DateTime", resolve: (post) => post.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (post) => post.updatedAt }),
    author: t.field({
      type: ProfileSummaryRef,
      resolve: async (post, _args, ctx) => {
        const author = await ctx.loaders.authorById.load(post.authorId);
        if (!author) throw new Error("Auteur introuvable.");
        return author;
      },
    }),
    comments: t.field({
      type: [PostCommentRef],
      resolve: (post, _args, ctx) => ctx.loaders.commentsByPostId.load(post.id),
    }),
  }),
});

// Référence circulaire : un commentaire peut contenir des réponses (qui sont
// des PostComment). Pothos gère ce pattern via objectRef + implement.
export const PostCommentRef = builder.objectRef<PostComment>("PostComment");

PostCommentRef.implement({
  description: "Commentaire ou réponse d'un post (F11).",
  fields: (t) => ({
    id: t.exposeID("id"),
    body: t.exposeString("body"),
    createdAt: t.field({ type: "DateTime", resolve: (comment) => comment.createdAt }),
    author: t.field({
      type: ProfileSummaryRef,
      resolve: async (comment, _args, ctx) => {
        const author = await ctx.loaders.authorById.load(comment.authorId);
        if (!author) throw new Error("Auteur introuvable.");
        return author;
      },
    }),
    replies: t.field({
      type: [PostCommentRef],
      resolve: (comment, _args, ctx) => ctx.loaders.repliesByCommentId.load(comment.id),
    }),
  }),
});

const PostEdgeRef = builder.objectRef<{ cursor: string; node: Post }>("PostEdge").implement({
  fields: (t) => ({
    cursor: t.exposeString("cursor"),
    node: t.field({ type: PostRef, resolve: (edge) => edge.node }),
  }),
});

const PostConnectionRef = builder
  .objectRef<{ edges: { cursor: string; node: Post }[]; hasNextPage: boolean; endCursor: string | null }>(
    "PostConnection",
  )
  .implement({
    fields: (t) => ({
      edges: t.field({ type: [PostEdgeRef], resolve: (page) => page.edges }),
      pageInfo: t.field({ type: PageInfoRef, resolve: (page) => page }),
    }),
  });

const CreatePostInput = builder.inputType("CreatePostInput", {
  fields: (t) => ({
    body: t.string({ required: true }),
  }),
});

const CreateCommentInput = builder.inputType("CreateCommentInput", {
  fields: (t) => ({
    postId: t.string({ required: true }),
    parentId: t.string(),
    body: t.string({ required: true }),
  }),
});

builder.queryFields((t) => ({
  posts: t.field({
    type: PostConnectionRef,
    args: { first: t.arg.int(), after: t.arg.string() },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const useCaseCtx = requireProfile(ctx);
        const { first, after } = validateInput(
          listPostsQuerySchema,
          { first: args.first ?? undefined, after: args.after ?? undefined },
        );
        return listPosts(useCaseCtx, { limit: first, after: after ?? undefined });
      }),
  }),

  post: t.field({
    type: PostRef,
    nullable: true,
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const id = validateInput(postIdSchema, String(args.id));
        return getPost(requireProfile(ctx), id);
      }),
  }),
}));

builder.mutationFields((t) => ({
  createPost: t.field({
    type: PostRef,
    args: { input: t.arg({ type: CreatePostInput, required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const input = validateInput(createPostSchema, { body: args.input.body });
        return createPost(requireProfile(ctx), input);
      }),
  }),

  deletePost: t.field({
    type: "Boolean",
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const id = validateInput(postIdSchema, String(args.id));
        await deletePost(requireProfile(ctx), id);
        return true;
      }),
  }),

  addComment: t.field({
    type: PostCommentRef,
    args: { input: t.arg({ type: CreateCommentInput, required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const input = validateInput(createCommentSchema, {
          postId: args.input.postId,
          parentId: args.input.parentId ?? undefined,
          body: args.input.body,
        });
        return addComment(requireProfile(ctx), input);
      }),
  }),

  deleteComment: t.field({
    type: "Boolean",
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const id = validateInput(postIdSchema, String(args.id));
        await deleteComment(requireProfile(ctx), id);
        return true;
      }),
  }),
}));