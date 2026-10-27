import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { ForbiddenError, NotFoundError, RuleViolationError } from "@/lib/errors";
import * as projectsRepo from "@/lib/repositories/projects";
import * as skillsRepo from "@/lib/repositories/skills";
import {
  createProject,
  deleteProject,
  getOwnProject,
  getVisibleProject,
  listMyProjects,
  publishProject,
  unpublishProject,
  updateProject,
} from "@/lib/projects";
import type { Project } from "@/lib/types";

const repo = vi.mocked(projectsRepo);
const skills = vi.mocked(skillsRepo);

const ctx = { userId: "u1", profileId: "p1" };

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "proj-1",
    authorId: "p1",
    title: "Covoiturage",
    body: "Une app de covoiturage.",
    coverKey: null,
    imageKeys: [],
    status: "draft",
    publishedAt: null,
    type: "personal",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("createProject (F05)", () => {
  it("crée le projet au nom du profil de la session (critère 1)", async () => {
    repo.insertProject.mockResolvedValue(project());
    skills.findOrCreateSkill.mockResolvedValue({ id: "s1", slug: "react", name: "React" });
    repo.replaceProjectSkills.mockResolvedValue(undefined);

    const created = await createProject(ctx, {
      title: "Covoiturage",
      body: "Une app de covoiturage.",
      skillSlugs: ["react"],
    });

    expect(created.authorId).toBe("p1");
    expect(repo.insertProject).toHaveBeenCalledWith(
      expect.objectContaining({ authorId: "p1", title: "Covoiturage" }),
    );
    expect(repo.replaceProjectSkills).toHaveBeenCalledWith("proj-1", ["s1"]);
  });

  it("n'enregistre aucune étiquette sans compétence", async () => {
    repo.insertProject.mockResolvedValue(project());

    await createProject(ctx, { title: "Covoiturage", body: "Texte.", skillSlugs: [] });

    expect(repo.replaceProjectSkills).not.toHaveBeenCalled();
  });

  it("refuse une couverture qui n'appartient pas au profil", async () => {
    await expect(
      createProject(ctx, {
        title: "Covoiturage",
        body: "Texte.",
        skillSlugs: [],
        coverKey: "projects/p2/image.png",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repo.insertProject).not.toHaveBeenCalled();
  });
});

describe("updateProject (F05 règle 3)", () => {
  it("modifie un projet possédé (critère 3)", async () => {
    repo.findOwnedProjectById.mockResolvedValue(project());
    repo.updateOwnedProject.mockResolvedValue(project({ title: "Nouveau titre" }));

    const updated = await updateProject(ctx, "proj-1", { title: "Nouveau titre" });

    expect(updated.title).toBe("Nouveau titre");
    expect(repo.updateOwnedProject).toHaveBeenCalledWith("proj-1", "p1", {
      title: "Nouveau titre",
    });
  });

  it("recalcule les preuves si les compétences changent sur un projet publié (règle 6)", async () => {
    repo.findOwnedProjectById.mockResolvedValue(project({ status: "published" }));
    repo.updateOwnedProject.mockResolvedValue(project({ status: "published" }));
    skills.findOrCreateSkill.mockResolvedValue({ id: "s1", slug: "react", name: "React" });

    await updateProject(ctx, "proj-1", { skillSlugs: ["react"] });

    expect(repo.replaceProjectSkills).toHaveBeenCalledWith("proj-1", ["s1"]);
    expect(repo.recomputeProofLevelsForProfile).toHaveBeenCalledWith("p1");
  });

  it("répond introuvable pour un projet d'un autre membre (critère 4)", async () => {
    repo.findOwnedProjectById.mockResolvedValue(null);

    await expect(updateProject(ctx, "proj-1", { title: "Vol" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repo.updateOwnedProject).not.toHaveBeenCalled();
  });
});

describe("deleteProject (F05 règle 4)", () => {
  it("supprime un projet possédé et recalcule les preuves", async () => {
    repo.findOwnedProjectById.mockResolvedValue(project());
    repo.deleteOwnedProject.mockResolvedValue(true);

    expect(await deleteProject(ctx, "proj-1")).toBe(true);
    expect(repo.recomputeProofLevelsForProfile).toHaveBeenCalledWith("p1");
  });

  it("ne recalcule rien si la suppression n'a pas eu lieu", async () => {
    repo.findOwnedProjectById.mockResolvedValue(project());
    repo.deleteOwnedProject.mockResolvedValue(false);

    expect(await deleteProject(ctx, "proj-1")).toBe(false);
    expect(repo.recomputeProofLevelsForProfile).not.toHaveBeenCalled();
  });
});

describe("publishProject (F06)", () => {
  it("publie un projet complet et recalcule les preuves", async () => {
    repo.findOwnedProjectById.mockResolvedValue(project());
    repo.markProjectPublished.mockResolvedValue(project({ status: "published" }));

    const published = await publishProject(ctx, "proj-1");

    expect(published.status).toBe("published");
    expect(repo.markProjectPublished).toHaveBeenCalled();
    expect(repo.recomputeProofLevelsForProfile).toHaveBeenCalledWith("p1");
  });

  it("refuse de publier sans titre ou sans texte", async () => {
    repo.findOwnedProjectById.mockResolvedValue(project({ title: "  " }));

    await expect(publishProject(ctx, "proj-1")).rejects.toBeInstanceOf(RuleViolationError);
    expect(repo.markProjectPublished).not.toHaveBeenCalled();
  });

  it("refuse une couverture étrangère", async () => {
    repo.findOwnedProjectById.mockResolvedValue(project());

    await expect(
      publishProject(ctx, "proj-1", "projects/p2/image.png"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("unpublishProject (F06)", () => {
  it("repasse le projet en brouillon", async () => {
    repo.findOwnedProjectById.mockResolvedValue(project({ status: "published" }));
    repo.markProjectUnpublished.mockResolvedValue(project({ status: "draft" }));

    const updated = await unpublishProject(ctx, "proj-1");

    expect(updated.status).toBe("draft");
    expect(repo.recomputeProofLevelsForProfile).toHaveBeenCalledWith("p1");
  });
});

describe("lectures", () => {
  it("getOwnProject renvoie le brouillon de l'auteur (F05 règle 1)", async () => {
    repo.findOwnedProjectById.mockResolvedValue(project());
    expect((await getOwnProject(ctx, "proj-1")).status).toBe("draft");
  });

  it("getVisibleProject masque un projet non visible derrière NOT_FOUND (critère 2)", async () => {
    repo.findVisibleProjectById.mockResolvedValue(null);
    await expect(getVisibleProject({ userId: null, profileId: null }, "proj-1")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("listMyProjects pagine par curseur (page suivante détectée)", async () => {
    repo.listProjectsByAuthor.mockResolvedValue([
      project({ id: "a", updatedAt: new Date("2026-02-01T00:00:00Z") }),
      project({ id: "b", updatedAt: new Date("2026-01-01T00:00:00Z") }),
    ]);

    const page = await listMyProjects(ctx, 1);

    expect(page.edges).toHaveLength(1);
    expect(page.pageInfo.hasNextPage).toBe(true);
    expect(page.edges[0]?.node.id).toBe("a");
    expect(page.pageInfo.endCursor).toBeTruthy();
  });
});
