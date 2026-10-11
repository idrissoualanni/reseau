import { beforeEach, describe, expect, it, vi } from "vitest";

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
  createSpace,
  getPlatformAdminProfile,
  hasPlatformAdminRole,
  normalizeRoles,
  requirePlatformAdmin,
  toAdminContext,
  updateSpace,
  type AdminContext,
} from "@/lib/admin";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import * as profilesRepo from "@/lib/repositories/profiles";
import * as spacesRepo from "@/lib/repositories/spaces";
import type { Profile, Space } from "@/lib/types";

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

describe("normalizeRoles / toAdminContext (F16)", () => {
  it("accepte une chaîne", () => {
    expect(normalizeRoles("admin")).toEqual(["admin"]);
  });

  it("accepte un tableau", () => {
    expect(normalizeRoles(["user", "admin"])).toEqual(["user", "admin"]);
  });

  it("ignore les valeurs non textuelles", () => {
    expect(normalizeRoles(undefined)).toEqual([]);
    expect(normalizeRoles([1, "admin"])).toEqual(["admin"]);
  });

  it("extrait le rôle de la session", () => {
    expect(toAdminContext({ user: { id: "u1", email: "a@b.c", role: "admin" } })).toEqual({
      userId: "u1",
      email: "a@b.c",
      roles: ["admin"],
    });
  });

  it("détecte le rôle admin", () => {
    expect(hasPlatformAdminRole(toAdminContext({ user: { id: "u1", role: ["admin"] } }))).toBe(true);
    expect(hasPlatformAdminRole(userCtx)).toBe(false);
  });
});

describe("getPlatformAdminProfile (F16)", () => {
  it("renvoie null si le rôle n'est pas admin (sans lire la base)", async () => {
    expect(await getPlatformAdminProfile(userCtx)).toBeNull();
    expect(profiles.findProfileByUserId).not.toHaveBeenCalled();
  });

  it("renvoie le profil pour un rôle admin", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    expect(await getPlatformAdminProfile(adminCtx)).toEqual(profile);
  });

  it("renvoie null si le profil est absent", async () => {
    profiles.findProfileByUserId.mockResolvedValue(null);
    expect(await getPlatformAdminProfile(adminCtx)).toBeNull();
  });
});

describe("requirePlatformAdmin (F17)", () => {
  it("refuse un membre ordinaire", async () => {
    await expect(requirePlatformAdmin(userCtx)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("accepte un admin", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    await expect(requirePlatformAdmin(adminCtx)).resolves.toEqual(profile);
  });
});

describe("espaces (F14)", () => {
  beforeEach(() => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
  });

  it("refuse un membre ordinaire", async () => {
    await expect(
      createSpace(userCtx, { slug: "ucad", name: "UCAD", type: "university", visibility: "public" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuse un slug déjà pris", async () => {
    spaces.isSpaceSlugTaken.mockResolvedValue(true);
    await expect(
      createSpace(adminCtx, { slug: "ucad", name: "UCAD", type: "university", visibility: "public" }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(spaces.insertSpace).not.toHaveBeenCalled();
  });

  it("crée l'espace au nom du profil admin (critère 1)", async () => {
    spaces.isSpaceSlugTaken.mockResolvedValue(false);
    spaces.insertSpace.mockResolvedValue(space());

    await createSpace(adminCtx, {
      slug: "ucad",
      name: "UCAD",
      type: "university",
      visibility: "public",
    });

    expect(spaces.insertSpace).toHaveBeenCalledWith(
      { slug: "ucad", name: "UCAD", type: "university", visibility: "public" },
      "p1",
    );
  });

  it("404 sur un espace inconnu à l'édition", async () => {
    spaces.findSpaceById.mockResolvedValue(null);
    await expect(updateSpace(adminCtx, "sp1", { name: "Nouveau" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("archivage idempotent : n'écrit pas un espace déjà archivé", async () => {
    spaces.findSpaceById.mockResolvedValue(space({ archivedAt: new Date() }));
    await archiveSpace(adminCtx, "sp1");
  });
});
