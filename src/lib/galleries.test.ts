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

vi.mock("@/lib/repositories/projects", () => ({
  insertProject: vi.fn(),
  findOwnedProjectById: vi.fn(),
  findVisibleProjectById: vi.fn(),
  updateOwnedProject: vi.fn(),
  deleteOwnedProject: vi.fn(),
  markProjectPublished: vi.fn(),
  markProjectUnpublished: vi.fn(),
  replaceProjectSkills: vi.fn(),
  listProjectSkills: vi.fn(),
  listProjectsByAuthor: vi.fn(),
  listPublishedProjects: vi.fn(),
  recomputeProofLevelsForProfile: vi.fn(),
}));

vi.mock("@/lib/repositories/skills", () => ({
  findOrCreateSkill: vi.fn(),
}));

import { ForbiddenError, ValidationError } from "@/lib/errors";
import * as postsRepo from "@/lib/repositories/posts";
import { createPost, createPostSchema } from "@/lib/posts";
import { createProject } from "@/lib/projects";
import { createProjectSchema } from "@/lib/validation/project";
import type { Post } from "@/lib/types";

const posts = vi.mocked(postsRepo);

const profileId = "00000000-0000-0000-0000-000000000001";
const ctx = { userId: "u1", profileId };

const key = (name: string) => `posts/${profileId}/${name}.jpg`;
const projectKey = (name: string) => `projects/${profileId}/${name}.jpg`;

const post = (overrides: Partial<Post> = {}): Post => ({
  id: "post-1",
  authorId: profileId,
  body: "Mon activité",
  imageKey: null,
  imageKeys: [],
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("galerie de posts (V1.5)", () => {
  it("accepte 4 images supplémentaires", () => {
    const parsed = createPostSchema.safeParse({
      body: "Une sortie",
      imageKeys: [key("b"), key("c"), key("d"), key("e")],
    });
    expect(parsed.success).toBe(true);
  });

  it("refuse plus de 4 images supplémentaires", () => {
    const parsed = createPostSchema.safeParse({
      body: "Une sortie",
      imageKeys: [key("b"), key("c"), key("d"), key("e"), key("f")],
    });
    expect(parsed.success).toBe(false);
  });

  it("refuse les doublons", () => {
    const parsed = createPostSchema.safeParse({
      body: "Une sortie",
      imageKeys: [key("b"), key("b")],
    });
    expect(parsed.success).toBe(false);
  });

  it("refuse une image qui appartient à un autre membre", async () => {
    await expect(
      createPost(ctx, {
        body: "Une sortie",
        imageKeys: ["posts/00000000-0000-0000-0000-000000000002/x.jpg"],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("transmet la couverture et la galerie au dépôt", async () => {
    posts.insertPost.mockResolvedValue(
      post({ imageKey: key("a"), imageKeys: [key("b")] }),
    );
    await createPost(ctx, { body: "Une sortie", imageKey: key("a"), imageKeys: [key("b")] });
    expect(posts.insertPost).toHaveBeenCalledWith(profileId, "Une sortie", key("a"), [key("b")]);
  });
});

describe("galerie de projets (V1.5)", () => {
  it("accepte 4 images supplémentaires", () => {
    const parsed = createProjectSchema.safeParse({
      title: "Mon projet",
      body: "Description",
      imageKeys: [projectKey("b"), projectKey("c")],
    });
    expect(parsed.success).toBe(true);
  });

  it("refuse plus de 4 images supplémentaires", () => {
    const parsed = createProjectSchema.safeParse({
      title: "Mon projet",
      body: "Description",
      imageKeys: [
        projectKey("b"),
        projectKey("c"),
        projectKey("d"),
        projectKey("e"),
        projectKey("f"),
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("refuse une image qui appartient à un autre membre", async () => {
    await expect(
      createProject(ctx, {
        title: "Mon projet",
        body: "Description",
        skillSlugs: [],
        imageKeys: ["projects/00000000-0000-0000-0000-000000000002/x.jpg"],
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
