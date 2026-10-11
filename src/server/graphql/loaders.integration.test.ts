import { beforeEach, describe, expect, it, vi } from "vitest";

// Les loaders ne changent pas de logique métier : on mocke uniquement la
// couche repository (la base) et on exerce la fabrique réelle (api-graphql §6).
vi.mock("@/lib/repositories/posts", () => ({
  listCommentsForPosts: vi.fn(),
}));
vi.mock("@/lib/repositories/profiles", () => ({
  findProfileSummariesByIds: vi.fn(),
}));
vi.mock("@/lib/repositories/projects", () => ({
  listProjectSkillsForProjects: vi.fn(),
}));

import * as postsRepo from "@/lib/repositories/posts";
import { createLoaders, type Loaders } from "@/server/graphql/loaders";

const repo = vi.mocked(postsRepo);

const POST_ID = "11111111-1111-1111-1111-111111111111";
const ROOT_ID = "22222222-2222-2222-2222-222222222222";
const REPLY_ID = "33333333-3333-3333-3333-333333333333";

function row(overrides: Partial<Awaited<ReturnType<typeof postsRepo.listCommentsForPosts>>[number]> = {}) {
  return {
    postId: POST_ID,
    id: ROOT_ID,
    parentId: null,
    authorId: "p1",
    body: "Bravo !",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

let loaders: Loaders;

beforeEach(() => {
  vi.resetAllMocks();
  loaders = createLoaders();
});

describe("loader commentsByPostId (F11, api-graphql §6)", () => {
  it("ne renvoie que les commentaires racines (les réponses passent par replies)", async () => {
    repo.listCommentsForPosts.mockResolvedValue([
      row(),
      row({ id: REPLY_ID, parentId: ROOT_ID, body: "Merci !" }),
    ]);

    const comments = await loaders.commentsByPostId.load(POST_ID);

    // Le champ `Post.comments` doit exposer les racines ; les réponses sont
    // imbriquées sous `PostComment.replies` — sinon elles sont comptées deux
    // fois (à plat et imbriquées).
    expect(comments.map((c) => c.id)).toEqual([ROOT_ID]);
  });
});
