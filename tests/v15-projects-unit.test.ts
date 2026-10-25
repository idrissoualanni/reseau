import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProject, updateProject, deleteProject, publishProject, unpublishProject } from "@/lib/projects";
import { addProjectReaction, removeProjectReaction, createProjectComment, deleteProjectComment, followProject, unfollowProject } from "@/lib/projects";
import { createProjectUpdate, deleteProjectUpdate } from "@/lib/projects";
import { listProjectsV15 } from "@/lib/projects";
import { NotFoundError, ForbiddenError, RuleViolationError } from "@/lib/errors";

// Mock repositories
vi.mock("@/lib/repositories/projects", () => ({
  insertProject: vi.fn(),
  findOwnedProjectById: vi.fn(),
  findVisibleProjectById: vi.fn(),
  updateOwnedProject: vi.fn(),
  deleteOwnedProject: vi.fn(),
  markProjectPublished: vi.fn(),
  markProjectUnpublished: vi.fn(),
  replaceProjectSkills: vi.fn(),
  findOrCreateSkill: vi.fn(),
  listProjectSkills: vi.fn(),
  listProjectsByAuthor: vi.fn(),
  listPublishedProjects: vi.fn(),
  listPublishedProjectsV15: vi.fn(),
  recomputeProofLevelsForProfile: vi.fn(),
  insertProjectReaction: vi.fn(),
  deleteProjectReaction: vi.fn(),
  findProjectReactionsByProjectId: vi.fn(),
  countProjectReactionsByProjectId: vi.fn(),
  findUserProjectReactions: vi.fn(),
  insertProjectComment: vi.fn(),
  findProjectCommentById: vi.fn(),
  deleteProjectComment: vi.fn(),
  listProjectCommentsByProjectId: vi.fn(),
  listProjectCommentRepliesByParentId: vi.fn(),
  insertProjectFollower: vi.fn(),
  deleteProjectFollower: vi.fn(),
  listProjectFollowersByProjectId: vi.fn(),
  countProjectFollowersByProjectId: vi.fn(),
  isProjectFollowedByProfile: vi.fn(),
  insertProjectUpdate: vi.fn(),
  findProjectUpdateById: vi.fn(),
  deleteProjectUpdate: vi.fn(),
  listProjectUpdatesByProjectId: vi.fn(),
  countProjectUpdatesByProjectId: vi.fn(),
}));

vi.mock("@/lib/repositories/skills", () => ({
  findOrCreateSkill: vi.fn(),
}));

import {
  insertProject,
  findOwnedProjectById,
  findVisibleProjectById,
  updateOwnedProject,
  deleteOwnedProject,
  markProjectPublished,
  markProjectUnpublished,
  replaceProjectSkills,
  listPublishedProjectsV15,
  findOrCreateSkill,
} from "@/lib/repositories/projects";

import {
  insertProjectReaction,
  deleteProjectReaction,
  findProjectReactionsByProjectId,
  countProjectReactionsByProjectId,
  findUserProjectReactions,
  insertProjectComment,
  findProjectCommentById,
  deleteProjectComment as repoDeleteProjectComment,
  listProjectCommentsByProjectId,
  listProjectCommentRepliesByParentId,
  insertProjectFollower,
  deleteProjectFollower,
  countProjectFollowersByProjectId,
  isProjectFollowedByProfile,
  insertProjectUpdate,
  findProjectUpdateById,
  deleteProjectUpdate,
} from "@/lib/repositories/projects";

describe("Projects Use Cases (F05/F06)", () => {
  const mockCtx = { userId: "user-1", profileId: "profile-1" };
  const mockProject = {
    id: "project-1",
    authorId: "profile-1",
    title: "Test Project",
    body: "Description",
    coverKey: null,
    status: "draft" as const,
    publishedAt: null,
    type: "personal" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProject", () => {
    it("should create a project with valid input", async () => {
      (findOrCreateSkill as any).mockResolvedValue({ id: "skill-1", slug: "react", name: "React" });
      (insertProject as any).mockResolvedValue(mockProject);
      (replaceProjectSkills as any).mockResolvedValue(undefined);

      const result = await createProject(mockCtx, {
        title: "Test Project",
        body: "Description",
        skillSlugs: ["react"],
        coverKey: null,
      });

      expect(result).toEqual(mockProject);
      expect(insertProject).toHaveBeenCalledWith({
        authorId: "profile-1",
        title: "Test Project",
        body: "Description",
        coverKey: null,
      });
    });

    it("should validate coverKey ownership", async () => {
      await expect(
        createProject(mockCtx, {
          title: "Test",
          body: "Desc",
          coverKey: "projects/other-profile/image.jpg",
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("updateProject", () => {
    it("should update project fields", async () => {
      (findOwnedProjectById as any).mockResolvedValue(mockProject);
      (updateOwnedProject as any).mockResolvedValue({ ...mockProject, title: "Updated" });

      const result = await updateProject(mockCtx, "project-1", { title: "Updated" });

      expect(result.title).toBe("Updated");
      expect(updateOwnedProject).toHaveBeenCalledWith("project-1", "profile-1", { title: "Updated" });
    });

    it("should throw NotFoundError for non-owned project", async () => {
      (findOwnedProjectById as any).mockResolvedValue(null);

      await expect(updateProject(mockCtx, "project-1", { title: "Updated" }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteProject", () => {
    it("should delete owned project", async () => {
      (findOwnedProjectById as any).mockResolvedValue(mockProject);
      (deleteOwnedProject as any).mockResolvedValue(true);
      (recomputeProofLevelsForProfile as any).mockResolvedValue(undefined);

      const result = await deleteProject(mockCtx, "project-1");

      expect(result).toBe(true);
      expect(deleteOwnedProject).toHaveBeenCalledWith("project-1", "profile-1");
    });
  });

  describe("publishProject", () => {
    it("should publish project with title and body", async () => {
      (findOwnedProjectById as any).mockResolvedValue({ ...mockProject, title: "Test", body: "Desc" });
      (markProjectPublished as any).mockResolvedValue({ ...mockProject, status: "published", publishedAt: new Date() });
      (recomputeProofLevelsForProfile as any).mockResolvedValue(undefined);

      const result = await publishProject(mockCtx, "project-1", null);

      expect(result.status).toBe("published");
    });

    it("should throw RuleViolationError if title or body empty", async () => {
      (findOwnedProjectById as any).mockResolvedValue({ ...mockProject, title: "", body: "Desc" });

      await expect(publishProject(mockCtx, "project-1", null))
        .rejects.toThrow(RuleViolationError);
    });
  });
});

describe("V1.5 — Project Reactions (F19)", () => {
  const mockCtx = { userId: "user-1", profileId: "profile-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addProjectReaction", () => {
    it("should add reaction when not already reacted", async () => {
      (findVisibleProjectById as any).mockResolvedValue({ id: "project-1", status: "published" });
      (findUserProjectReactions as any).mockResolvedValue([]);
      (insertProjectReaction as any).mockResolvedValue({ projectId: "project-1", profileId: "profile-1", type: "like", createdAt: new Date() });
      (countProjectReactionsByProjectId as any).mockResolvedValue(new Map([["like", 1]]));
      (findUserProjectReactions as any).mockResolvedValueOnce([{ type: "like" }]);

      const result = await addProjectReaction(mockCtx, { projectId: "project-1", type: "like" });

      expect(result).toHaveLength(4); // 4 reaction types
      expect(result.find(r => r.type === "like")?.count).toBe(1);
      expect(result.find(r => r.type === "like")?.hasReacted).toBe(true);
    });

    it("should remove reaction when already reacted (toggle)", async () => {
      (findVisibleProjectById as any).mockResolvedValue({ id: "project-1", status: "published" });
      (findUserProjectReactions as any).mockResolvedValue([{ type: "like" }]);
      (deleteProjectReaction as any).mockResolvedValue(true);
      (countProjectReactionsByProjectId as any).mockResolvedValue(new Map());
      (findUserProjectReactions as any).mockResolvedValue([]);

      const result = await addProjectReaction(mockCtx, { projectId: "project-1", type: "like" });

      expect(result.find(r => r.type === "like")?.count).toBe(0);
      expect(result.find(r => r.type === "like")?.hasReacted).toBe(false);
    });

    it("should throw ForbiddenError for non-published project", async () => {
      (findVisibleProjectById as any).mockResolvedValue({ id: "project-1", status: "draft" });

      await expect(addProjectReaction(mockCtx, { projectId: "project-1", type: "like" }))
        .rejects.toThrow(ForbiddenError);
    });
  });

  describe("removeProjectReaction", () => {
    it("should remove reaction", async () => {
      (findVisibleProjectById as any).mockResolvedValue({ id: "project-1", status: "published" });
      (deleteProjectReaction as any).mockResolvedValue(true);

      const result = await removeProjectReaction(mockCtx, "project-1", "like");

      expect(result).toBe(true);
    });
  });
});

describe("V1.5 — Project Comments (F19)", () => {
  const mockCtx = { userId: "user-1", profileId: "profile-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProjectComment", () => {
    it("should create root comment on published project", async () => {
      (findVisibleProjectById as any).mockResolvedValue({ id: "project-1", status: "published" });
      (insertProjectComment as any).mockResolvedValue({
        id: "comment-1",
        projectId: "project-1",
        parentId: null,
        authorId: "profile-1",
        body: "Great project!",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createProjectComment(mockCtx, {
        projectId: "project-1",
        body: "Great project!",
      });

      expect(result.body).toBe("Great project!");
      expect(result.parentId).toBeNull();
    });

    it("should create reply to comment", async () => {
      (findVisibleProjectById as any).mockResolvedValue({ id: "project-1", status: "published" });
      (findProjectCommentById as any).mockResolvedValue({ id: "comment-1", projectId: "project-1", parentId: null });
      (insertProjectComment as any).mockResolvedValue({
        id: "reply-1",
        projectId: "project-1",
        parentId: "comment-1",
        authorId: "profile-1",
        body: "Thanks!",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createProjectComment(mockCtx, {
        projectId: "project-1",
        parentId: "comment-1",
        body: "Thanks!",
      });

      expect(result.parentId).toBe("comment-1");
    });

    it("should throw RuleViolationError if reply targets different project", async () => {
      (findVisibleProjectById as any).mockResolvedValue({ id: "project-1", status: "published" });
      (findProjectCommentById as any).mockResolvedValue({ id: "comment-1", projectId: "project-2" });

      await expect(createProjectComment(mockCtx, {
        projectId: "project-1",
        parentId: "comment-1",
        body: "Thanks!",
      })).rejects.toThrow(RuleViolationError);
    });
  });

  describe("deleteProjectComment", () => {
    it("should delete own comment", async () => {
      (repoDeleteProjectComment as any).mockResolvedValue(true);

      await deleteProjectComment(mockCtx, "comment-1");

      expect(repoDeleteProjectComment).toHaveBeenCalledWith("comment-1", "profile-1");
    });

    it("should throw NotFoundError for non-owned comment", async () => {
      (repoDeleteProjectComment as any).mockResolvedValue(false);

      await expect(deleteProjectComment(mockCtx, "comment-1"))
        .rejects.toThrow(NotFoundError);
    });
  });
});

describe("V1.5 — Project Follow (F19)", () => {
  const mockCtx = { userId: "user-1", profileId: "profile-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("followProject", () => {
    it("should follow published project", async () => {
      (findVisibleProjectById as any).mockResolvedValue({ id: "project-1", status: "published" });
      (insertProjectFollower as any).mockResolvedValue({ projectId: "project-1", profileId: "profile-1", createdAt: new Date() });

      const result = await followProject(mockCtx, "project-1");

      expect(result).toBe(true);
    });

    it("should throw ForbiddenError for non-published project", async () => {
      (findVisibleProjectById as any).mockResolvedValue({ id: "project-1", status: "draft" });

      await expect(followProject(mockCtx, "project-1")).rejects.toThrow(ForbiddenError);
    });
  });

  describe("unfollowProject", () => {
    it("should unfollow project", async () => {
      (findVisibleProjectById as any).mockResolvedValue({ id: "project-1", status: "published" });
      (deleteProjectFollower as any).mockResolvedValue(true);

      const result = await unfollowProject(mockCtx, "project-1");

      expect(result).toBe(true);
    });
  });
});

describe("V1.5 — Project Updates (F20)", () => {
  const mockCtx = { userId: "user-1", profileId: "profile-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProjectUpdate", () => {
    it("should create update for owned project", async () => {
      (findOwnedProjectById as any).mockResolvedValue({ id: "project-1", authorId: "profile-1" });
      (insertProjectUpdate as any).mockResolvedValue({
        id: "update-1",
        projectId: "project-1",
        authorId: "profile-1",
        body: "Progress update!",
        imageKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createProjectUpdate(mockCtx, {
        projectId: "project-1",
        body: "Progress update!",
      });

      expect(result.body).toBe("Progress update!");
    });

    it("should validate imageKey prefix", async () => {
      (findOwnedProjectById as any).mockResolvedValue({ id: "project-1", authorId: "profile-1" });

      await expect(createProjectUpdate(mockCtx, {
        projectId: "project-1",
        body: "Update",
        imageKey: "projects/other-profile/updates/image.jpg",
      })).rejects.toThrow(RuleViolationError);
    });

    it("should throw NotFoundError for non-owned project", async () => {
      (findOwnedProjectById as any).mockResolvedValue(null);

      await expect(createProjectUpdate(mockCtx, {
        projectId: "project-1",
        body: "Update",
      })).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteProjectUpdate", () => {
    it("should delete own update", async () => {
      (findProjectUpdateById as any).mockResolvedValue({ id: "update-1", projectId: "project-1", authorId: "profile-1" });
      (deleteProjectUpdate as any).mockResolvedValue(true);

      await deleteProjectUpdate(mockCtx, "update-1");

      expect(deleteProjectUpdate).toHaveBeenCalledWith("update-1", "profile-1");
    });

    it("should throw NotFoundError for non-owned update", async () => {
      (findProjectUpdateById as any).mockResolvedValue({ id: "update-1", authorId: "other-profile" });
      (deleteProjectUpdate as any).mockResolvedValue(false);

      await expect(deleteProjectUpdate(mockCtx, "update-1")).rejects.toThrow(NotFoundError);
    });
  });
});

describe("V1.5 — Catalogue Projects (F18)", () => {
  const mockViewerCtx = { userId: "user-1", profileId: "profile-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should filter by skillSlugs (AND)", async () => {
    (listPublishedProjectsV15 as any).mockResolvedValue([
      { id: "p1", type: "personal", title: "React Project", body: "Using React", publishedAt: new Date(), authorId: "profile-2" },
    ]);

    const result = await listProjectsV15(mockViewerCtx, {
      limit: 20,
      skillSlugs: ["react", "typescript"],
    });

    expect(listPublishedProjectsV15).toHaveBeenCalledWith(
      expect.objectContaining({ skillSlugs: ["react", "typescript"] })
    );
    expect(result.edges).toHaveLength(1);
  });

  it("should filter by projectTypes", async () => {
    (listPublishedProjectsV15 as any).mockResolvedValue([]);

    await listProjectsV15(mockViewerCtx, {
      limit: 20,
      projectTypes: ["team", "open_source"],
    });

    expect(listPublishedProjectsV15).toHaveBeenCalledWith(
      expect.objectContaining({ projectTypes: ["team", "open_source"] })
    );
  });

  it("should search by text (trigram)", async () => {
    (listPublishedProjectsV15 as any).mockResolvedValue([]);

    await listProjectsV15(mockViewerCtx, {
      limit: 20,
      search: "machine learning",
    });

    expect(listPublishedProjectsV15).toHaveBeenCalledWith(
      expect.objectContaining({ search: "machine learning" })
    );
  });
});