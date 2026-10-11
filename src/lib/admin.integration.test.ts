import { beforeEach, describe, expect, it, vi } from "vitest";

// Intégration de la garde d'administration (F16/F17) : on exerce les cas
// d'usage réels avec la base mockée. Complète `admin.test.ts` sur les chemins
// positifs et le fait que l'autorisation est vérifiée AVANT toute lecture.
vi.mock("@/lib/repositories/admin", () => ({
  adminStats: vi.fn(),
  listAdminAccessLog: vi.fn(),
  listAdminPosts: vi.fn(),
  listAdminProfiles: vi.fn(),
  listAdminProjects: vi.fn(),
}));

vi.mock("@/lib/repositories/profiles", () => ({
  findProfileById: vi.fn(),
  findProfileByUserId: vi.fn(),
  findProfileByUsername: vi.fn(),
}));

vi.mock("@/lib/repositories/spaces", () => ({
  archiveSpaceById: vi.fn(),
  findSpaceById: vi.fn(),
  findSpaceBySlug: vi.fn(),
  insertSpace: vi.fn(),
  isSpaceSlugTaken: vi.fn(),
  listAllSpaces: vi.fn(),
  listPublicSpaces: vi.fn(),
  listSpacesWithMemberCounts: vi.fn(),
  updateSpaceById: vi.fn(),
}));

import {
  archiveSpace,
  getAdminStats,
  listPostsForAdmin,
  requirePlatformAdmin,
  type AdminContext,
} from "@/lib/admin";
import { ForbiddenError } from "@/lib/errors";
import * as adminRepo from "@/lib/repositories/admin";
import * as profilesRepo from "@/lib/repositories/profiles";
import * as spacesRepo from "@/lib/repositories/spaces";
import type { Profile, Space } from "@/lib/types";

const admin = vi.mocked(adminRepo);
const profiles = vi.mocked(profilesRepo);
const spaces = vi.mocked(spacesRepo);

const adminCtx: AdminContext = { userId: "u1", roles: ["admin"] };
const userCtx: AdminContext = { userId: "u1", roles: ["user"] };

const profile: Profile = {
  id: "p1",
  userId: "u1",
  username: "awa",
  displayName: "Awa Diop",
  bio: null,
  schoolName: null,
  fieldOfStudy: null,
  avatarKey: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

function space(overrides: Partial<Space> = {}): Space {
  return {
    id: "sp1",
    slug: "ucad",
    name: "UCAD",
    description: null,
    type: "university",
    visibility: "public",
    metadata: {},
    createdBy: "p1",
    archivedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("requirePlatformAdmin (F16)", () => {
  it("accepte un admin", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    await expect(requirePlatformAdmin(adminCtx)).resolves.toEqual(profile);
  });

  it("refuse un membre ordinaire", async () => {
    await expect(requirePlatformAdmin(userCtx)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("garde avant lecture (F17)", () => {
  it("getAdminStats refuse un membre sans lire de statistiques", async () => {
    await expect(getAdminStats(userCtx)).rejects.toBeInstanceOf(ForbiddenError);
    expect(admin.adminStats).not.toHaveBeenCalled();
  });

  it("listPostsForAdmin refuse un membre sans lire de posts", async () => {
    await expect(listPostsForAdmin(userCtx)).rejects.toBeInstanceOf(ForbiddenError);
    expect(admin.listAdminPosts).not.toHaveBeenCalled();
  });

  it("getAdminStats lit les statistiques pour un administrateur", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    const stats = {
      spaces: 1,
      archivedSpaces: 0,
      profiles: 3,
      posts: 1,
      projects: 3,
      accessEvents: 0,
    };
    admin.adminStats.mockResolvedValue(stats);
    await expect(getAdminStats(adminCtx)).resolves.toEqual(stats);
  });
});

describe("archiveSpace (F14)", () => {
  it("archive un espace actif au nom de l'administrateur", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    spaces.findSpaceById.mockResolvedValue(space());
    await archiveSpace(adminCtx, "sp1");
    expect(spaces.archiveSpaceById).toHaveBeenCalledWith("sp1");
  });

  it("archivage idempotent : n'écrit pas un espace déjà archivé", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    spaces.findSpaceById.mockResolvedValue(space({ archivedAt: new Date() }));
    await archiveSpace(adminCtx, "sp1");
    expect(spaces.archiveSpaceById).not.toHaveBeenCalled();
  });
});
