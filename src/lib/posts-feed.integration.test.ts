import { beforeEach, describe, expect, it, vi } from "vitest";

// Intégration du fil de posts (F11) : on exerce `loadPostsFeed`/`loadPostDetail`
// avec la vraie logique d'assemblage ; seules la base et l'URL publique sont
// mockées (aucun accès réseau ni Postgres).
vi.mock("@/lib/repositories/posts", () => ({
  insertPost: vi.fn(),
  findPostById: vi.fn(),
  listPosts: vi.fn(),
  deletePostById: vi.fn(),
  insertComment: vi.fn(),
  findCommentById: vi.fn(),
  deleteCommentById: vi.fn(),
  listCommentsForPosts: vi.fn(),
  countCommentsForPosts: vi.fn(),
  countLikesForPosts: vi.fn(),
  listLikedPostIds: vi.fn(),
  countPostLikes: vi.fn(),
  isPostLikedByProfile: vi.fn(),
}));

vi.mock("@/lib/repositories/profiles", () => ({
  findProfileSummariesByIds: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  getPublicUrl: vi.fn((key: string) => `https://cdn.test/${key}`),
  postImagePrefix: vi.fn((id: string) => `posts/${id}/`),
}));

import * as postsRepo from "@/lib/repositories/posts";
import * as profilesRepo from "@/lib/repositories/profiles";
import type { CommentRow } from "@/lib/repositories/posts";
import type { ProfileSummaryRow } from "@/lib/repositories/profiles";
import type { Post } from "@/lib/types";
import { loadPostDetail, loadPostsFeed } from "@/lib/posts-feed";

const repo = vi.mocked(postsRepo);
const profiles = vi.mocked(profilesRepo);

const ctx = { userId: "u1", profileId: "p1" };

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: "post-1",
    authorId: "p1",
    body: "J'ai terminé mon POC React.",
    imageKey: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function comment(overrides: Partial<CommentRow> = {}): CommentRow {
  return {
    postId: "post-1",
    id: "c1",
    parentId: null,
    authorId: "p1",
    body: "Bravo !",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function author(overrides: Partial<ProfileSummaryRow> = {}): ProfileSummaryRow {
  return {
    id: "p1",
    username: "awa",
    displayName: "Awa Diop",
    avatarKey: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  repo.countLikesForPosts.mockResolvedValue(new Map());
  repo.listLikedPostIds.mockResolvedValue(new Set());
  repo.countPostLikes.mockResolvedValue(0);
  repo.isPostLikedByProfile.mockResolvedValue(false);
});

describe("loadPostsFeed (F11)", () => {
  it("renvoie un fil vide sans interroger commentaires ni auteurs", async () => {
    repo.listPosts.mockResolvedValue([]);

    const feed = await loadPostsFeed(ctx, { limit: 20 });

    expect(feed).toEqual({ edges: [], hasNextPage: false, endCursor: null });
    expect(repo.listCommentsForPosts).not.toHaveBeenCalled();
    expect(repo.countCommentsForPosts).not.toHaveBeenCalled();
    expect(profiles.findProfileSummariesByIds).not.toHaveBeenCalled();
  });

  it("assemble post, auteur, compteur et arbre des commentaires", async () => {
    repo.listPosts.mockResolvedValue([
      post({ id: "post-1", imageKey: "posts/p1/a.jpg" }),
    ]);
    repo.countCommentsForPosts.mockResolvedValue(new Map([["post-1", 2]]));
    repo.listCommentsForPosts.mockResolvedValue([
      comment({ id: "c1", body: "Bravo !" }),
      comment({ id: "c2", parentId: "c1", authorId: "p2", body: "Merci !" }),
    ]);
    profiles.findProfileSummariesByIds.mockResolvedValue([
      author(),
      author({ id: "p2", username: "moussa", displayName: "Moussa Ndiaye" }),
    ]);

    const feed = await loadPostsFeed(ctx, { limit: 20 });

    expect(feed.edges).toHaveLength(1);
    const edge = feed.edges[0]!;
    expect(edge.post).toMatchObject({
      id: "post-1",
      body: "J'ai terminé mon POC React.",
      imageUrl: "https://cdn.test/posts/p1/a.jpg",
      authorId: "p1",
      commentCount: 2,
      likeCount: 0,
      hasLiked: false,
    });
    expect(edge.author).toMatchObject({ id: "p1", username: "awa" });
    // Arbre : racine (depth 0) puis réponse (depth 1, parentId = racine).
    expect(edge.comments.map((c) => [c.id, c.depth, c.parentId])).toEqual([
      ["c1", 0, null],
      ["c2", 1, "c1"],
    ]);
  });

  it("expose une imageUrl nulle sans imageKey", async () => {
    repo.listPosts.mockResolvedValue([post({ imageKey: null })]);
    repo.countCommentsForPosts.mockResolvedValue(new Map());
    repo.listCommentsForPosts.mockResolvedValue([]);
    profiles.findProfileSummariesByIds.mockResolvedValue([author()]);

    const feed = await loadPostsFeed(ctx, { limit: 20 });

    expect(feed.edges[0]!.post.imageUrl).toBeNull();
  });

  it("signale hasNextPage et tronque à limit quand le repo renvoie limit + 1", async () => {
    repo.listPosts.mockResolvedValue([
      post({ id: "post-1", createdAt: new Date("2026-01-02T00:00:00Z") }),
      post({ id: "post-2", createdAt: new Date("2026-01-01T00:00:00Z") }),
    ]);
    repo.countCommentsForPosts.mockResolvedValue(new Map());
    repo.listCommentsForPosts.mockResolvedValue([]);
    profiles.findProfileSummariesByIds.mockResolvedValue([author()]);

    const feed = await loadPostsFeed(ctx, { limit: 1 });

    expect(feed.edges).toHaveLength(1);
    expect(feed.edges[0]!.post.id).toBe("post-1");
    expect(feed.hasNextPage).toBe(true);
    expect(feed.endCursor).not.toBeNull();
  });
});

describe("loadPostDetail (F11)", () => {
  it("renvoie null pour un post inexistant", async () => {
    repo.findPostById.mockResolvedValue(null);
    expect(await loadPostDetail(ctx, "post-x")).toBeNull();
  });

  it("renvoie le post et son arbre de commentaires", async () => {
    repo.findPostById.mockResolvedValue(post());
    repo.listCommentsForPosts.mockResolvedValue([
      comment({ id: "c1" }),
      comment({ id: "c2", parentId: "c1", body: "Merci !" }),
    ]);
    profiles.findProfileSummariesByIds.mockResolvedValue([author()]);

    const detail = await loadPostDetail(ctx, "post-1");

    expect(detail).not.toBeNull();
    expect(detail!.post.id).toBe("post-1");
    expect(detail!.author).toMatchObject({ username: "awa" });
    expect(detail!.comments.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(detail!.likeCount).toBe(0);
    expect(detail!.hasLiked).toBe(false);
  });

  it("propage les j'aime du viewer", async () => {
    repo.findPostById.mockResolvedValue(post());
    repo.listCommentsForPosts.mockResolvedValue([]);
    profiles.findProfileSummariesByIds.mockResolvedValue([author()]);
    repo.countPostLikes.mockResolvedValue(3);
    repo.isPostLikedByProfile.mockResolvedValue(true);

    const detail = await loadPostDetail(ctx, "post-1");

    expect(detail!.likeCount).toBe(3);
    expect(detail!.hasLiked).toBe(true);
  });
});
