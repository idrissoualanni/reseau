import { beforeEach, describe, expect, it, vi } from "vitest";

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
  createSpace,
  getPlatformAdminProfile,
  requirePlatformAdmin,
  revokePlatformAdmin,
  updateSpace,
} from "@/lib/admin";
import { ConflictError, ForbiddenError, NotFoundError, RuleViolationError } from "@/lib/errors";
import { getPlatformAdminEmails } from "@/lib/env";
import * as platformAdminsRepo from "@/lib/repositories/platform-admins";
import * as profilesRepo from "@/lib/repositories/profiles";
import * as spacesRepo from "@/lib/repositories/spaces";
import type { Profile, Space } from "@/lib/types";

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

beforeEach(() => {
  vi.resetAllMocks();
  getAdminEmails.mockReturnValue(new Set<string>());
});

describe("getPlatformAdminProfile (F16)", () => {
  it("renvoie null sans profil", async () => {
    profiles.findProfileByUserId.mockResolvedValue(null);
    expect(await getPlatformAdminProfile({ userId: "u1" })).toBeNull();
  });

  it("renvoie le profil d'un admin existant", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    platformAdmins.isPlatformAdmin.mockResolvedValue(true);
    expect(await getPlatformAdminProfile({ userId: "u1" })).toEqual(profile);
  });

  it("s'amorce par liste blanche d'e-mails (idempotent)", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    platformAdmins.isPlatformAdmin.mockResolvedValue(false);
    getAdminEmails.mockReturnValue(new Set(["awa@example.com"]));
    platformAdmins.insertPlatformAdmin.mockResolvedValue(undefined);

    const result = await getPlatformAdminProfile({ userId: "u1", email: "Awa@Example.com" });
    expect(result).toEqual(profile);
    expect(platformAdmins.insertPlatformAdmin).toHaveBeenCalledWith("p1", null);
  });

  it("renvoie null hors liste blanche", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    platformAdmins.isPlatformAdmin.mockResolvedValue(false);
    expect(await getPlatformAdminProfile({ userId: "u1", email: "autre@example.com" })).toBeNull();
    expect(platformAdmins.insertPlatformAdmin).not.toHaveBeenCalled();
  });
});

describe("requirePlatformAdmin (F17)", () => {
  it("refuse un membre ordinaire", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    platformAdmins.isPlatformAdmin.mockResolvedValue(false);
    await expect(requirePlatformAdmin({ userId: "u1" })).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("espaces (F14)", () => {
  beforeEach(() => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    platformAdmins.isPlatformAdmin.mockResolvedValue(true);
  });

  it("refuse un slug déjà pris", async () => {
    spaces.isSpaceSlugTaken.mockResolvedValue(true);
    await expect(
      createSpace(
        { userId: "u1" },
        { slug: "ucad", name: "UCAD", type: "university", visibility: "public" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(spaces.insertSpace).not.toHaveBeenCalled();
  });

  it("crée l'espace au nom du profil admin (critère 1)", async () => {
    spaces.isSpaceSlugTaken.mockResolvedValue(false);
    spaces.insertSpace.mockResolvedValue(space());

    await createSpace(
      { userId: "u1" },
      { slug: "ucad", name: "UCAD", type: "university", visibility: "public" },
    );

    expect(spaces.insertSpace).toHaveBeenCalledWith(
      { slug: "ucad", name: "UCAD", type: "university", visibility: "public" },
      "p1",
    );
  });

  it("404 sur un espace inconnu à l'édition", async () => {
    spaces.findSpaceById.mockResolvedValue(null);
    await expect(updateSpace({ userId: "u1" }, "sp1", { name: "Nouveau" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("archivage idempotent : n'écrit pas un espace déjà archivé", async () => {
    spaces.findSpaceById.mockResolvedValue(space({ archivedAt: new Date() }));
    await archiveSpace({ userId: "u1" }, "sp1");
    expect(spaces.archiveSpaceById).not.toHaveBeenCalled();
  });
});

describe("revokePlatformAdmin (F16)", () => {
  beforeEach(() => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    platformAdmins.isPlatformAdmin.mockResolvedValue(true);
  });

  it("protège le dernier administrateur", async () => {
    platformAdmins.countPlatformAdmins.mockResolvedValue(1);
    await expect(revokePlatformAdmin({ userId: "u1" }, "p2")).rejects.toBeInstanceOf(
      RuleViolationError,
    );
    expect(platformAdmins.deletePlatformAdmin).not.toHaveBeenCalled();
  });

  it("retire un admin quand il en reste d'autres", async () => {
    platformAdmins.countPlatformAdmins.mockResolvedValue(3);
    platformAdmins.deletePlatformAdmin.mockResolvedValue(true);
    await revokePlatformAdmin({ userId: "u1" }, "p2");
    expect(platformAdmins.deletePlatformAdmin).toHaveBeenCalledWith("p2");
  });
});
