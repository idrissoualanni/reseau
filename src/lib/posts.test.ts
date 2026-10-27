import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repositories/posts", () => ({
  insertPost: vi.fn(),
  findPostById: vi.fn(),
  listPosts: vi.fn(),
  deletePostById: vi.fn(),
  insertComment: vi.fn(),
  findCommentById: vi.fn(),
  deleteCommentById: vi.fn(),
  listPostsByAuthor: vi.fn(),
  updatePostById: vi.fn(),
  insertPostLike: vi.fn(),
  deletePostLike: vi.fn(),
  countPostLikes: vi.fn(),
  isPostLikedByProfile: vi.fn(),
  countLikesForPosts: vi.fn(),
  listLikedPostIds: vi.fn(),
}));

import { NotFoundError, ValidationError } from "@/lib/errors";
import { decodeCursor } from "@/lib/pagination";
import * as postsRepo from "@/lib/repositories/posts";
import {
  MAX_COMMENT_BODY,
  MAX_POST_BODY,
  addComment,
  createCommentSchema,
  createPost,
  createPostSchema,
  deleteComment,
  deletePost,
  getOwnPost,
  getPost,
  listOwnPosts,
  listPosts,
  togglePostLike,
  updatePost,
} from "@/lib/posts";
import {
  MAX_POST_IMAGE_BYTES,
  postImageKeySchema,
  presignPostImageSchema,
} from "@/lib/validation/post";
import type { Post, PostComment } from "@/lib/types";

const repo = vi.mocked(postsRepo);

const ctx = { userId: "u1", profileId: "p1" };

// ProfileId réaliste (UUID) pour les clés d'image F12.
const uuidProfile = "00000000-0000-0000-0000-000000000001";
const f12Ctx = { userId: "u1", profileId: uuidProfile };

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: "post-1",
    authorId: "p1",
    body: "J'ai terminé mon POC React.",
    imageKey: null,
    imageKeys: [],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function comment(overrides: Partial<PostComment> = {}): PostComment {
  return {
    id: "c1",
    postId: "post-1",
    parentId: null,
    authorId: "p1",
    body: "Bravo !",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("createPost (F11)", () => {
  it("crée le post au nom du profil de la session (règle 1)", async () => {
    repo.insertPost.mockResolvedValue(post());

    const created = await createPost(ctx, { body: "J'ai terminé mon POC React." });

    expect(repo.insertPost).toHaveBeenCalledWith(
      "p1",
      "J'ai terminé mon POC React.",
      null,
      [],
    );
    expect(created.id).toBe("post-1");
  });

  it("transmet l'imageKey quand le préfixe appartient au membre (F12)", async () => {
    repo.insertPost.mockResolvedValue(
      post({ imageKey: `posts/${uuidProfile}/img.jpg` }),
    );

    const created = await createPost(f12Ctx, {
      body: "Mon POC React.",
      imageKey: `posts/${uuidProfile}/img.jpg`,
    });

    expect(repo.insertPost).toHaveBeenCalledWith(
      uuidProfile,
      "Mon POC React.",
      `posts/${uuidProfile}/img.jpg`,
      [],
    );
    expect(created.imageKey).toBe(`posts/${uuidProfile}/img.jpg`);
  });

  it("refuse une imageKey hors du préfixe du membre (F12)", async () => {
    await expect(
      createPost(f12Ctx, {
        body: "Mon POC React.",
        imageKey: "posts/00000000-0000-0000-0000-000000000002/img.jpg",
      }),
    ).rejects.toThrow(ValidationError);
    expect(repo.insertPost).not.toHaveBeenCalled();
  });
});

describe("validation des posts (F11 règle 4)", () => {
  it("rejette un post vide", () => {
    expect(createPostSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(createPostSchema.safeParse({ body: "" }).success).toBe(false);
  });

  it("rejette un texte contenant du HTML", () => {
    const result = createPostSchema.safeParse({ body: "<script>alert(1)</script>" });
    expect(result.success).toBe(false);
  });

  it("rejette un texte trop long (5000 max)", () => {
    expect(
      createPostSchema.safeParse({ body: "a".repeat(MAX_POST_BODY + 1) }).success,
    ).toBe(false);
    expect(createPostSchema.safeParse({ body: "a".repeat(MAX_POST_BODY) }).success).toBe(true);
  });

  it("rejette un commentaire vide ou trop long (1000 max)", () => {
    const base = { postId: "00000000-0000-0000-0000-000000000001", parentId: null };
    expect(createCommentSchema.safeParse({ ...base, body: "" }).success).toBe(false);
    expect(
      createCommentSchema.safeParse({ ...base, body: "a".repeat(MAX_COMMENT_BODY + 1) }).success,
    ).toBe(false);
    expect(
      createCommentSchema.safeParse({ ...base, body: "a".repeat(MAX_COMMENT_BODY) }).success,
    ).toBe(true);
  });

  it("accepte une imageKey bien formée dans le préfixe du membre (F12)", () => {
    const result = createPostSchema.safeParse({
      body: "Mon POC React.",
      imageKey: `posts/${uuidProfile}/ab12cd.jpg`,
    });
    expect(result.success).toBe(true);
  });

  it("rejette une imageKey hors du préfixe `posts/{profileId}/` (F12)", () => {
    for (const key of ["projects/p1/a.jpg", "posts/../../a.jpg", "posts/p1/../x", "posts/p1"]) {
      expect(postImageKeySchema.safeParse(key).success).toBe(false);
    }
  });

  it("accepte un post sans imageKey (F12)", () => {
    expect(createPostSchema.safeParse({ body: "Juste du texte." }).success).toBe(true);
  });
});

describe("presignPostImageSchema (F12)", () => {
  it("accepte une image ≤ 10 Mo", () => {
    const result = presignPostImageSchema.safeParse({
      kind: "post-image",
      contentType: "image/jpeg",
      size: MAX_POST_IMAGE_BYTES,
    });
    expect(result.success).toBe(true);
  });

  it("rejette une image > 10 Mo", () => {
    const result = presignPostImageSchema.safeParse({
      kind: "post-image",
      contentType: "image/jpeg",
      size: MAX_POST_IMAGE_BYTES + 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejette un type MIME non-image", () => {
    const result = presignPostImageSchema.safeParse({
      kind: "post-image",
      contentType: "application/pdf",
      size: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejette un kind inconnu", () => {
    const result = presignPostImageSchema.safeParse({
      kind: "avatar",
      contentType: "image/jpeg",
      size: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe("deletePost (F11)", () => {
  it("supprime uniquement un post appartenant au lecteur (règle 5)", async () => {
    repo.deletePostById.mockResolvedValue(true);

    await deletePost(ctx, "post-1");

    expect(repo.deletePostById).toHaveBeenCalledWith("post-1", "p1");
  });

  it("renvoie NOT_FOUND si le post n'existe pas ou appartient à un autre (sans révéler)", async () => {
    repo.deletePostById.mockResolvedValue(false);

    await expect(deletePost(ctx, "post-1")).rejects.toThrow(NotFoundError);
  });
});

describe("updatePost (F11)", () => {
  it("met à jour le post du lecteur", async () => {
    repo.findPostById.mockResolvedValue(post());
    repo.updatePostById.mockResolvedValue(post({ body: "Texte corrigé." }));

    const updated = await updatePost(ctx, {
      id: "post-1",
      body: "Texte corrigé.",
    });

    expect(repo.updatePostById).toHaveBeenCalledWith(
      "post-1",
      "p1",
      "Texte corrigé.",
      undefined,
      undefined,
    );
    expect(updated.body).toBe("Texte corrigé.");
  });

  it("refuse le post d'un autre auteur", async () => {
    repo.findPostById.mockResolvedValue(post({ authorId: "p2" }));

    await expect(
      updatePost(ctx, { id: "post-1", body: "Hack." }),
    ).rejects.toThrow(NotFoundError);
    expect(repo.updatePostById).not.toHaveBeenCalled();
  });

  it("refuse une clé d'image hors du préfixe du lecteur", async () => {
    repo.findPostById.mockResolvedValue(post());

    await expect(
      updatePost(ctx, {
        id: "post-1",
        body: "Texte.",
        imageKey: "posts/other/img.jpg",
      }),
    ).rejects.toThrow(ValidationError);
  });
});

describe("getOwnPost (F11)", () => {
  it("renvoie NOT_FOUND pour un post d'un autre", async () => {
    repo.findPostById.mockResolvedValue(post({ authorId: "p2" }));
    await expect(getOwnPost(ctx, "post-1")).rejects.toThrow(NotFoundError);
  });
});

describe("listOwnPosts (F11)", () => {
  it("pagine les posts de l'auteur connecté", async () => {
    repo.listPostsByAuthor.mockResolvedValue([
      post(),
      post({ id: "post-2", createdAt: new Date("2025-12-01T00:00:00Z") }),
    ]);

    const page = await listOwnPosts(ctx, { limit: 1 });

    expect(repo.listPostsByAuthor).toHaveBeenCalledWith("p1", 1, undefined);
    expect(page.posts).toHaveLength(1);
    expect(page.hasNextPage).toBe(true);
  });
});

describe("togglePostLike (F11)", () => {
  it("ajoute un j'aime quand il n'existe pas", async () => {
    repo.findPostById.mockResolvedValue(post());
    repo.isPostLikedByProfile.mockResolvedValue(false);
    repo.countPostLikes.mockResolvedValue(1);

    const result = await togglePostLike(ctx, "post-1");

    expect(repo.insertPostLike).toHaveBeenCalledWith("post-1", "p1");
    expect(result).toEqual({ postId: "post-1", likeCount: 1, hasLiked: true });
  });

  it("retire un j'aime existant", async () => {
    repo.findPostById.mockResolvedValue(post());
    repo.isPostLikedByProfile.mockResolvedValue(true);
    repo.countPostLikes.mockResolvedValue(0);

    const result = await togglePostLike(ctx, "post-1");

    expect(repo.deletePostLike).toHaveBeenCalledWith("post-1", "p1");
    expect(result).toEqual({ postId: "post-1", likeCount: 0, hasLiked: false });
  });

  it("refuse un post inexistant", async () => {
    repo.findPostById.mockResolvedValue(null);
    await expect(togglePostLike(ctx, "post-x")).rejects.toThrow(NotFoundError);
  });
});

describe("getPost (F11)", () => {
  it("renvoie le post existant", async () => {
    repo.findPostById.mockResolvedValue(post());

    await expect(getPost(ctx, "post-1")).resolves.toMatchObject({ id: "post-1" });
  });

  it("renvoie NOT_FOUND si le post n'existe pas", async () => {
    repo.findPostById.mockResolvedValue(null);

    await expect(getPost(ctx, "post-1")).rejects.toThrow(NotFoundError);
  });
});

describe("listPosts (F11)", () => {
  it("pagine par curseur sans dépasser le limit (règle 5)", async () => {
    const rows = [post(), post({ id: "post-2", createdAt: new Date("2025-12-01T00:00:00Z") })];
    repo.listPosts.mockResolvedValue(rows);

    const page = await listPosts(ctx, { limit: 1 });

    expect(page.edges.length).toBe(1);
    expect(page.hasNextPage).toBe(true);
    expect(page.edges[0]?.node.id).toBe("post-1");
    expect(decodeCursor(page.endCursor!).id).toBe("post-1");
  });

  it("conditionne hasNextPage selon la présence d'une ligne excédentaire", async () => {
    repo.listPosts.mockResolvedValue([post()]);

    const page = await listPosts(ctx, { limit: 20 });

    expect(page.hasNextPage).toBe(false);
    expect(decodeCursor(page.endCursor!).id).toBe("post-1");
  });
});

describe("addComment (F11)", () => {
  it("ajoute un commentaire si le post existe (règle 2)", async () => {
    repo.findPostById.mockResolvedValue(post());
    repo.insertComment.mockResolvedValue(comment());

    const created = await addComment(ctx, {
      postId: "post-1",
      parentId: null,
      body: "Bravo !",
    });

    expect(repo.insertComment).toHaveBeenCalledWith({
      postId: "post-1",
      parentId: null,
      authorId: "p1",
      body: "Bravo !",
    });
    expect(created.id).toBe("c1");
  });

  it("refuse un commentaire sur un post inexistant", async () => {
    repo.findPostById.mockResolvedValue(null);

    await expect(
      addComment(ctx, { postId: "post-1", parentId: null, body: "Salut" }),
    ).rejects.toThrow(NotFoundError);
    expect(repo.insertComment).not.toHaveBeenCalled();
  });

  it("refuse une réponse qui ne cible pas le même post (règle 3)", async () => {
    repo.findPostById.mockResolvedValue(post());
    repo.findCommentById.mockResolvedValue(
      comment({ id: "c2", postId: "post-9" }),
    );

    await expect(
      addComment(ctx, { postId: "post-1", parentId: "c2", body: "Réponse" }),
    ).rejects.toThrow(ValidationError);
    expect(repo.insertComment).not.toHaveBeenCalled();
  });

  it("accepte une réponse à un commentaire du même post (règle 3)", async () => {
    repo.findPostById.mockResolvedValue(post());
    repo.findCommentById.mockResolvedValue(comment({ id: "c2" }));
    repo.insertComment.mockResolvedValue(
      comment({ id: "c3", parentId: "c2" }),
    );

    const created = await addComment(ctx, {
      postId: "post-1",
      parentId: "c2",
      body: "En effet.",
    });

    expect(repo.insertComment).toHaveBeenCalledWith({
      postId: "post-1",
      parentId: "c2",
      authorId: "p1",
      body: "En effet.",
    });
    expect(created.parentId).toBe("c2");
  });
});

describe("deleteComment (F11)", () => {
  it("supprime uniquement un commentaire appartenant au lecteur (règle 5)", async () => {
    repo.deleteCommentById.mockResolvedValue(true);

    await deleteComment(ctx, "c1");

    expect(repo.deleteCommentById).toHaveBeenCalledWith("c1", "p1");
  });

  it("renvoie NOT_FOUND si le commentaire n'appartient pas au lecteur", async () => {
    repo.deleteCommentById.mockResolvedValue(false);

    await expect(deleteComment(ctx, "c1")).rejects.toThrow(NotFoundError);
  });
});