import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Intégration GraphQL (api-graphql §14) : on exécute le VRAI schéma Pothos et
// les VRAIS cas d'usage ; seule la couche repository (base) est mockée.
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
}));

import type { GraphQLContext } from "@/server/graphql/builder";
import { schema } from "@/server/graphql/schema";
import * as postsRepo from "@/lib/repositories/posts";
import type { Post, PostComment } from "@/lib/types";

// Même instance `graphql` que Pothos (CJS) — sinon « another module or realm ».
const require = createRequire(import.meta.url);
const { graphql } = require("graphql") as typeof import("graphql");

const repo = vi.mocked(postsRepo);

const POST_ID = "11111111-1111-1111-1111-111111111111";
const PARENT_ID = "22222222-2222-2222-2222-222222222222";

// Les champs `author`/`replies` ne sont pas demandés dans ces requêtes : un
// loader factice suffit à satisfaire le type de contexte.
function fakeLoaders(): GraphQLContext["loaders"] {
  const loader = {
    load: vi.fn(),
    loadMany: vi.fn(),
    clear: vi.fn(),
    clearAll: vi.fn(),
    prime: vi.fn(),
  };
  return {
    authorById: loader,
    skillsByProjectId: loader,
    commentsByPostId: loader,
    repliesByCommentId: loader,
  } as unknown as GraphQLContext["loaders"];
}

function ctx(overrides: Partial<GraphQLContext> = {}): GraphQLContext {
  return { userId: "u1", profileId: "p1", loaders: fakeLoaders(), ...overrides };
}

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: POST_ID,
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
    postId: POST_ID,
    parentId: null,
    authorId: "p1",
    body: "Bravo !",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

const ADD_COMMENT = `mutation AddComment($input: CreateCommentInput!) {
  addComment(input: $input) { id body }
}`;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GraphQL addComment (F11)", () => {
  it("crée un commentaire racine sans parentId (parentId = null)", async () => {
    repo.findPostById.mockResolvedValue(post());
    repo.insertComment.mockResolvedValue(comment());

    const result = await graphql({
      schema,
      source: ADD_COMMENT,
      variableValues: { input: { postId: POST_ID, body: "Bravo !" } },
      contextValue: ctx(),
    });

    expect(result.errors).toBeUndefined();
    expect(repo.insertComment).toHaveBeenCalledWith({
      postId: POST_ID,
      parentId: null,
      authorId: "p1",
      body: "Bravo !",
    });
  });

  it("crée une réponse en conservant le parentId", async () => {
    repo.findPostById.mockResolvedValue(post());
    repo.findCommentById.mockResolvedValue(comment({ id: PARENT_ID }));
    repo.insertComment.mockResolvedValue(comment({ id: "c2", parentId: PARENT_ID }));

    const result = await graphql({
      schema,
      source: ADD_COMMENT,
      variableValues: {
        input: { postId: POST_ID, parentId: PARENT_ID, body: "En effet." },
      },
      contextValue: ctx(),
    });

    expect(result.errors).toBeUndefined();
    expect(repo.insertComment).toHaveBeenCalledWith({
      postId: POST_ID,
      parentId: PARENT_ID,
      authorId: "p1",
      body: "En effet.",
    });
  });

  it("refuse une requête anonyme (UNAUTHENTICATED)", async () => {
    const result = await graphql({
      schema,
      source: ADD_COMMENT,
      variableValues: { input: { postId: POST_ID, body: "Bravo !" } },
      contextValue: ctx({ userId: null, profileId: null }),
    });

    expect(result.errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
    expect(repo.insertComment).not.toHaveBeenCalled();
  });

  it("refuse un corps contenant du HTML (VALIDATION)", async () => {
    repo.findPostById.mockResolvedValue(post());

    const result = await graphql({
      schema,
      source: ADD_COMMENT,
      variableValues: {
        input: { postId: POST_ID, body: "<script>alert(1)</script>" },
      },
      contextValue: ctx(),
    });

    expect(result.errors?.[0]?.extensions?.code).toBe("VALIDATION");
    expect(repo.insertComment).not.toHaveBeenCalled();
  });
});
