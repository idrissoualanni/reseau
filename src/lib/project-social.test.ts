import { describe, expect, it } from "vitest";
import type { AuthorSummary } from "@/lib/api/mappers/profile";
import type { ProjectComment } from "@/lib/types";
import { buildProjectCommentTree } from "./project-social";
import { createProjectUpdateSchema } from "@/lib/validation/project";

const author: AuthorSummary = {
  id: "00000000-0000-4000-8000-000000000001",
  username: "ada",
  displayName: "Ada",
  avatarUrl: null,
};

function comment(
  id: string,
  parentId: string | null,
  createdAt: string,
  authorId = author.id,
): ProjectComment {
  return {
    id,
    projectId: "00000000-0000-4000-8000-0000000000aa",
    parentId,
    authorId,
    body: `body-${id}`,
    createdAt: new Date(createdAt),
    updatedAt: new Date(createdAt),
  };
}

describe("buildProjectCommentTree", () => {
  it("trie les racines du plus récent au plus ancien et imbrique les réponses", () => {
    const rows = [
      comment("00000000-0000-4000-8000-000000000002", null, "2026-01-01T10:00:00Z"),
      comment("00000000-0000-4000-8000-000000000003", null, "2026-01-02T10:00:00Z"),
      comment(
        "00000000-0000-4000-8000-000000000004",
        "00000000-0000-4000-8000-000000000002",
        "2026-01-01T11:00:00Z",
      ),
      comment(
        "00000000-0000-4000-8000-000000000005",
        "00000000-0000-4000-8000-000000000004",
        "2026-01-01T12:00:00Z",
      ),
    ];

    const tree = buildProjectCommentTree(rows, new Map([[author.id, author]]));

    expect(tree.map((node) => node.id)).toEqual([
      "00000000-0000-4000-8000-000000000003",
      "00000000-0000-4000-8000-000000000002",
    ]);
    expect(tree[1]?.replies[0]?.depth).toBe(1);
    expect(tree[1]?.replies[0]?.replies[0]?.depth).toBe(2);
  });

  it("ne dépasse pas trois niveaux et garde un auteur de secours", () => {
    const rows = [
      comment("00000000-0000-4000-8000-000000000010", null, "2026-01-01T10:00:00Z"),
      comment(
        "00000000-0000-4000-8000-000000000011",
        "00000000-0000-4000-8000-000000000010",
        "2026-01-01T11:00:00Z",
      ),
      comment(
        "00000000-0000-4000-8000-000000000012",
        "00000000-0000-4000-8000-000000000011",
        "2026-01-01T12:00:00Z",
      ),
      comment(
        "00000000-0000-4000-8000-000000000013",
        "00000000-0000-4000-8000-000000000012",
        "2026-01-01T13:00:00Z",
      ),
      comment(
        "00000000-0000-4000-8000-000000000014",
        null,
        "2026-01-01T09:00:00Z",
        "00000000-0000-4000-8000-000000000099",
      ),
    ];

    const tree = buildProjectCommentTree(rows, new Map([[author.id, author]]));

    expect(tree[0]?.replies[0]?.replies[0]?.replies).toEqual([]);
    expect(tree[1]?.author.displayName).toBe("Membre supprimé");
  });
});

describe("createProjectUpdateSchema", () => {
  it("accepte une image sans texte", () => {
    const result = createProjectUpdateSchema.safeParse({
      projectId: "00000000-0000-4000-8000-0000000000aa",
      imageKey:
        "projects/00000000-0000-4000-8000-000000000001/updates/a.webp",
    });
    expect(result.success).toBe(true);
  });

  it("refuse une mise à jour vide", () => {
    const result = createProjectUpdateSchema.safeParse({
      projectId: "00000000-0000-4000-8000-0000000000aa",
    });
    expect(result.success).toBe(false);
  });
});
