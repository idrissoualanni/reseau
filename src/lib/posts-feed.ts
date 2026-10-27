import type { ViewerContext } from "@/lib/context";
import { listPosts, listPostsByAuthor } from "@/lib/posts";
import { findPostById } from "@/lib/repositories/posts";
import {
  countCommentsForPosts,
  countLikesForPosts,
  countPostLikes,
  isPostLikedByProfile,
  listCommentsForPosts,
  listLikedPostIds,
  type CommentRow,
} from "@/lib/repositories/posts";
import {
  findProfileSummariesByIds,
  type ProfileSummaryRow,
} from "@/lib/repositories/profiles";
import { toAuthorSummary, type AuthorSummary } from "@/lib/api/mappers/profile";
import type { Post } from "@/lib/types";
import { galleryUrls, getPublicUrl } from "@/lib/storage";

// Assemblage du fil de posts (F11) : une page de posts + leurs auteurs et
// commentaires, chargés par lots (jamais de N+1). Les widgets DTO sont créés
// côte serveur : commentaires triés par date croissante pour l'affichage.

// Galerie 5 images (V1.5) : couverture + images supplémentaires, URLs publiques.
export function postImageUrls(post: Pick<Post, "imageKey" | "imageKeys">): string[] {
  return galleryUrls(post.imageKey, post.imageKeys);
}

export type FeedPost = {
  id: string;
  body: string;
  imageUrl: string | null;
  imageUrls: string[];
  createdAt: string;
  authorId: string;
  commentCount: number;
  likeCount: number;
  hasLiked: boolean;
};

export type FeedComment = {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  author: AuthorSummary | null;
  depth: number;
};

export type PostFeedEdge = {
  cursor: string;
  post: FeedPost;
  author: AuthorSummary | null;
  comments: FeedComment[];
};

export type PostFeedPage = {
  edges: PostFeedEdge[];
  hasNextPage: boolean;
  endCursor: string | null;
};

export type PostFeedOptions = {
  limit: number;
  after?: string;
};

function sortAsc(rows: CommentRow[]): CommentRow[] {
  return [...rows].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  );
}

// Construit l'arbre d'affichage : indentation max 3 niveaux visuels ; les
// réponses plus profondes sont comptabilisées et masquées (« voir plus »).
function buildCommentTrees(
  rows: CommentRow[],
  authors: Map<string, ProfileSummaryRow>,
  maxDepth = 3,
): FeedComment[] {
  const byParent = new Map<string | null, CommentRow[]>();
  for (const row of sortAsc(rows)) {
    const key = row.parentId;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  }

  const trees: FeedComment[] = [];

  function walk(parentId: string | null, depth: number): void {
    const children = byParent.get(parentId) ?? [];
    for (const child of children) {
      trees.push({
        id: child.id,
        postId: child.postId,
        parentId: child.parentId,
        body: child.body,
        createdAt: child.createdAt.toISOString(),
        author: toAuthorSummary(authors.get(child.authorId) ?? null),
        depth,
      });
      // On n'affiche que 3 niveaux de profondeur.
      if (depth + 1 < maxDepth) walk(child.id, depth + 1);
    }
  }

  walk(null, 0);
  return trees;
}

export async function loadPostsFeed(
  ctx: ViewerContext,
  options: PostFeedOptions,
): Promise<PostFeedPage> {
  return assembleFeed(ctx, await listPosts(ctx, options));
}

// Fil des posts d'un auteur, utilisé par le profil public.
export async function loadAuthorPostsFeed(
  ctx: ViewerContext,
  authorId: string,
  options: PostFeedOptions,
): Promise<PostFeedPage> {
  return assembleFeed(ctx, await listPostsByAuthor(ctx, authorId, options));
}

async function assembleFeed(
  ctx: ViewerContext,
  page: Awaited<ReturnType<typeof listPosts>>,
): Promise<PostFeedPage> {
  const postIds = page.edges.map((edge) => edge.node.id);
  if (postIds.length === 0) {
    return { edges: [], hasNextPage: false, endCursor: null };
  }

  const [commentRows, counts, likeCounts, likedPostIds, authorRows] = await Promise.all([
    listCommentsForPosts(postIds),
    countCommentsForPosts(postIds),
    countLikesForPosts(postIds),
    listLikedPostIds(postIds, ctx.profileId),
    findProfileSummariesByIds(page.edges.map((edge) => edge.node.authorId)),
  ]);

  const authorById = new Map(authorRows.map((row) => [row.id, row]));
  const commentsByPost = new Map<string, CommentRow[]>();
  for (const row of commentRows) {
    const list = commentsByPost.get(row.postId) ?? [];
    list.push(row);
    commentsByPost.set(row.postId, list);
  }

  const edges = page.edges.map((edge) => {
    const post = edge.node as Post;
    const comments = buildCommentTrees(
      commentsByPost.get(post.id) ?? [],
      authorById,
    );
    return {
      cursor: edge.cursor,
      post: {
        id: post.id,
        body: post.body,
        imageUrl: post.imageKey ? getPublicUrl(post.imageKey) : null,
        imageUrls: postImageUrls(post),
        createdAt: post.createdAt.toISOString(),
        authorId: post.authorId,
        commentCount: counts.get(post.id) ?? 0,
        likeCount: likeCounts.get(post.id) ?? 0,
        hasLiked: likedPostIds.has(post.id),
      },
      author: toAuthorSummary(authorById.get(post.authorId) ?? null),
      comments,
    };
  });

  return {
    edges,
    hasNextPage: page.hasNextPage,
    endCursor: page.endCursor,
  };
}

// Détail d'un post (F11) : post + arbre complet des commentaires (auteurs
// chargés par lots), pour la page `/posts/[id]`.
export async function loadPostDetail(
  ctx: ViewerContext,
  postId: string,
): Promise<{
  post: Post;
  imageUrl: string | null;
  imageUrls: string[];
  author: AuthorSummary | null;
  comments: FeedComment[];
  likeCount: number;
  hasLiked: boolean;
} | null> {
  const post = await findPostById(postId);
  if (!post) return null;

  const [commentRows, authorRows, likeCount, hasLiked] = await Promise.all([
    listCommentsForPosts([post.id]),
    findProfileSummariesByIds([post.authorId]),
    countPostLikes(post.id),
    ctx.profileId ? isPostLikedByProfile(post.id, ctx.profileId) : Promise.resolve(false),
  ]);

  const authorById = new Map(authorRows.map((row) => [row.id, row]));
  const comments = buildCommentTrees(commentRows, authorById);

  return {
    post,
    imageUrl: post.imageKey ? getPublicUrl(post.imageKey) : null,
    imageUrls: postImageUrls(post),
    author: toAuthorSummary(authorById.get(post.authorId) ?? null),
    comments,
    likeCount,
    hasLiked,
  };
}