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

vi.mock("@/lib/repositories/platform-admins", () => ({
  countPlatformAdmins: vi.fn(),
  deletePlatformAdmin: vi.fn(),
  insertPlatformAdmin: vi.fn(),
  isPlatformAdmin: vi.fn(),
  listPlatformAdmins: vi.fn(),
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

vi.mock("@/lib/env", () => ({
  getPlatformAdminEmails: vi.fn(() => new Set<string>()),
}));

import {
  archiveSpace,
  getAdminStats,
  listPostsForAdmin,
  requirePlatformAdmin,
} from "@/lib/admin";
import { ForbiddenError } from "@/lib/errors";
import { getPlatformAdminEmails } from "@/lib/env";
import * as adminRepo from "@/lib/repositories/admin";
import * as platformAdminsRepo from "@/lib/repositories/platform-admins";
import * as profilesRepo from "@/lib/repositories/profiles";
import * as spacesRepo from "@/lib/repositories/spaces";
import type { Profile, Space } from "@/lib/types";

const admin = vi.mocked(adminRepo);
const platformAdmins = vi.mocked(platformAdminsRepo);
const profiles = vi.mocked(profilesRepo);
const spaces = vi.mocked(spacesRepo);
const getAdminEmails = vi.mocked(getPlatformAdminEmails);

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

function actAsAdmin(): void {
  profiles.findProfileByUserId.mockResolvedValue(profile);
  platformAdmins.isPlatformAdmin.mockResolvedValue(true);
}

function actAsMember(): void {
  profiles.findProfileByUserId.mockResolvedValue(profile);
  platformAdmins.isPlatformAdmin.mockResolvedValue(false);
}

beforeEach(() => {
  vi.resetAllMocks();
  getAdminEmails.mockReturnValue(new Set<string>());
});

describe("requirePlatformAdmin (F16)", () => {
  it("renvoie le profil d'un administrateur plateforme", async () => {
    actAsAdmin();
    await expect(requirePlatformAdmin({ userId: "u1" })).resolves.toEqual(profile);
  });

  it("refuse un membre ordinaire", async () => {
    actAsMember();
    await expect(requirePlatformAdmin({ userId: "u1" })).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("garde avant lecture (F17)", () => {
  it("getAdminStats refuse un membre sans lire de statistiques", async () => {
    actAsMember();
    await expect(getAdminStats({ userId: "u1" })).rejects.toBeInstanceOf(ForbiddenError);
    expect(admin.adminStats).not.toHaveBeenCalled();
  });

  it("listPostsForAdmin refuse un membre sans lire de posts", async () => {
    actAsMember();
    await expect(listPostsForAdmin({ userId: "u1" })).rejects.toBeInstanceOf(ForbiddenError);
    expect(admin.listAdminPosts).not.toHaveBeenCalled();
  });

  it("getAdminStats lit les statistiques pour un administrateur", async () => {
    actAsAdmin();
    const stats = {
      spaces: 1,
      archivedSpaces: 0,
      platformAdmins: 1,
      profiles: 3,
      posts: 1,
      projects: 3,
      accessEvents: 0,
    };
    admin.adminStats.mockResolvedValue(stats);
    await expect(getAdminStats({ userId: "u1" })).resolves.toEqual(stats);
  });
});

describe("archiveSpace (F14)", () => {
  it("archive un espace actif au nom de l'administrateur", async () => {
    actAsAdmin();
    spaces.findSpaceById.mockResolvedValue(space());
    spaces.archiveSpaceById.mockResolvedValue(true);

    await archiveSpace({ userId: "u1" }, "sp1");

    expect(spaces.archiveSpaceById).toHaveBeenCalledWith("sp1");
  });

  it("n'archive pas un espace déjà archivé", async () => {
    actAsAdmin();
    spaces.findSpaceById.mockResolvedValue(space({ archivedAt: new Date() }));

    await archiveSpace({ userId: "u1" }, "sp1");

    expect(spaces.archiveSpaceById).not.toHaveBeenCalled();
  });
});
