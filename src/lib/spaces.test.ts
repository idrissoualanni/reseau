import { beforeEach, describe, expect, it, vi } from "vitest";

// Les repositories sont simulés : les cas d'usage se testent sans base (testing.md §2).
vi.mock("@/lib/repositories/admin", () => ({
  adminStats: vi.fn(),
  listAdminAccessLog: vi.fn(),
  listAdminPosts: vi.fn(),
  listAdminProfiles: vi.fn(),
  listAdminProjects: vi.fn(),
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

vi.mock("@/lib/repositories/profiles", () => ({
  findProfileByUserId: vi.fn(),
}));

vi.mock("@/lib/repositories/space-members", () => ({
  countMembers: vi.fn(),
  deleteMembershipById: vi.fn(),
  findMembership: vi.fn(),
  insertAccessLog: vi.fn(),
  insertMembership: vi.fn(),
  listAccessMethods: vi.fn(),
  listActiveAccessMethods: vi.fn(),
  listMembershipsForSpace: vi.fn(),
  setAccessMethodActive: vi.fn(),
  updateMembershipById: vi.fn(),
  upsertAccessMethod: vi.fn(),
}));

import { createHash } from "node:crypto";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import * as profilesRepo from "@/lib/repositories/profiles";
import * as spacesRepo from "@/lib/repositories/spaces";
import * as membersRepo from "@/lib/repositories/space-members";
import { joinSpace, requireSpaceManagerOrPlatform, configureAccessMethod } from "@/lib/spaces";
import type {
  Membership,
  Profile,
  Space,
  SpaceAccessKind,
  SpaceAccessMethod,
  SpaceMember,
} from "@/lib/types";

const spaces = vi.mocked(spacesRepo);
const members = vi.mocked(membersRepo);
const profiles = vi.mocked(profilesRepo);

const viewer = { profileId: "p1" };

// Empreinte SHA-256 attendue par la config `invite_code`.
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function space(overrides: Partial<Space> = {}): Space {
  return {
    id: "sp1",
    slug: "ucad",
    name: "UCAD",
    description: null,
    type: "university",
    visibility: "public",
    metadata: {},
    createdBy: "p-admin",
    archivedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function accessMethod(
  kind: SpaceAccessKind,
  config: Record<string, unknown> = {},
  isActive = true,
): SpaceAccessMethod {
  return {
    id: `am-${kind}`,
    spaceId: "sp1",
    method: kind,
    config,
    isActive,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
}

function membership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: "m1",
    spaceId: "sp1",
    profileId: "p1",
    role: "member",
    verificationLevel: "unverified",
    verifiedVia: "open",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

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

beforeEach(() => {
  vi.resetAllMocks();
  spaces.findSpaceBySlug.mockResolvedValue(space());
  members.findMembership.mockResolvedValue(null);
  members.insertAccessLog.mockResolvedValue(undefined);
  profiles.findProfileByUserId.mockResolvedValue(profile);
});

describe("joinSpace (F15)", () => {
  it("espace `open` : adhésion immédiate non vérifiée, journal `join` (critère 1)", async () => {
    members.listActiveAccessMethods.mockResolvedValue([accessMethod("open")]);
    members.insertMembership.mockResolvedValue(
      membership({ verificationLevel: "unverified", verifiedVia: "open" }),
    );

    const result = await joinSpace(viewer, "ucad", { method: "open" });

    expect(result.status).toBe("joined");
    expect(members.insertMembership).toHaveBeenCalledWith({
      spaceId: "sp1",
      profileId: "p1",
      verificationLevel: "unverified",
      verifiedVia: "open",
    });
    expect(members.insertAccessLog).toHaveBeenCalledWith({
      spaceId: "sp1",
      profileId: "p1",
      method: "open",
      action: "join",
    });
  });

  it("`manual_approval` : demande en attente, journal `request` (critère 4)", async () => {
    members.listActiveAccessMethods.mockResolvedValue([accessMethod("manual_approval")]);
    members.insertMembership.mockResolvedValue(
      membership({ verificationLevel: "unverified", verifiedVia: "manual_approval" }),
    );

    const result = await joinSpace(viewer, "ucad", { method: "manual_approval", message: "Bonjour" });

    expect(result.status).toBe("pending");
    expect(members.insertAccessLog).toHaveBeenCalledWith({
      spaceId: "sp1",
      profileId: "p1",
      method: "manual_approval",
      action: "request",
    });
  });

  it("`invite_code` valide : appartenance vérifiée (critère 3)", async () => {
    members.listActiveAccessMethods.mockResolvedValue([
      accessMethod("invite_code", { codeHash: sha256("secret") }),
    ]);
    members.insertMembership.mockResolvedValue(
      membership({ verificationLevel: "verified", verifiedVia: "invite_code" }),
    );

    const result = await joinSpace(viewer, "ucad", { method: "invite_code", code: "secret" });

    expect(result.status).toBe("joined");
    expect(members.insertMembership).toHaveBeenCalledWith(
      expect.objectContaining({ verificationLevel: "verified", verifiedVia: "invite_code" }),
    );
  });

  it("`invite_code` faux : ValidationError sans création (critère 2)", async () => {
    members.listActiveAccessMethods.mockResolvedValue([
      accessMethod("invite_code", { codeHash: sha256("secret") }),
    ]);

    await expect(
      joinSpace(viewer, "ucad", { method: "invite_code", code: "faux" }),
    ).rejects.toThrow("Code d'invitation invalide.");
    expect(members.insertMembership).not.toHaveBeenCalled();
  });

  it("`invite_link` valide : appartenance vérifiée, journal `join` (F15 règle 4)", async () => {
    members.listActiveAccessMethods.mockResolvedValue([
      accessMethod("invite_link", {
        tokenHash: sha256("jeton"),
        expiresAt: "2999-01-01T00:00:00.000Z",
      }),
    ]);
    members.insertMembership.mockResolvedValue(
      membership({ verificationLevel: "verified", verifiedVia: "invite_link" }),
    );

    const result = await joinSpace(viewer, "ucad", { method: "invite_link", token: "jeton" });

    expect(result.status).toBe("joined");
    expect(members.insertMembership).toHaveBeenCalledWith(
      expect.objectContaining({ verificationLevel: "verified", verifiedVia: "invite_link" }),
    );
    expect(members.insertAccessLog).toHaveBeenCalledWith({
      spaceId: "sp1",
      profileId: "p1",
      method: "invite_link",
      action: "join",
    });
  });

  it("`invite_link` expiré : ValidationError sans création (F15 règle 4)", async () => {
    members.listActiveAccessMethods.mockResolvedValue([
      accessMethod("invite_link", {
        tokenHash: sha256("jeton"),
        expiresAt: "2020-01-01T00:00:00.000Z",
      }),
    ]);

    await expect(
      joinSpace(viewer, "ucad", { method: "invite_link", token: "jeton" }),
    ).rejects.toThrow("Ce lien d'invitation a expiré.");
    expect(members.insertMembership).not.toHaveBeenCalled();
  });

  it("refuse un membre déjà actif (critère 6)", async () => {
    members.listActiveAccessMethods.mockResolvedValue([accessMethod("open")]);
    members.findMembership.mockResolvedValue(
      membership({ verificationLevel: "verified", verifiedVia: "invite_code" }),
    );

    await expect(joinSpace(viewer, "ucad", { method: "open" })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(members.insertMembership).not.toHaveBeenCalled();
  });

  it("refuse une demande déjà en attente", async () => {
    members.listActiveAccessMethods.mockResolvedValue([accessMethod("manual_approval")]);
    members.findMembership.mockResolvedValue(
      membership({ verificationLevel: "unverified", verifiedVia: "manual_approval" }),
    );

    await expect(
      joinSpace(viewer, "ucad", { method: "manual_approval" }),
    ).rejects.toThrow("Ta demande est déjà en attente.");
    expect(members.insertMembership).not.toHaveBeenCalled();
  });

  it("refuse une méthode indisponible (non active ou inconnue)", async () => {
    members.listActiveAccessMethods.mockResolvedValue([accessMethod("open")]);

    await expect(joinSpace(viewer, "ucad", { method: "invite_code", code: "x" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(members.insertMembership).not.toHaveBeenCalled();
  });

  it("espace privé : introuvable, aucune fuite d'existence (critère 5)", async () => {
    spaces.findSpaceBySlug.mockResolvedValue(space({ visibility: "private" }));

    await expect(joinSpace(viewer, "ucad", { method: "open" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("requireSpaceManagerOrPlatform (F15 autorisation)", () => {
  const spaceAdmin: SpaceMember = {
    membership: membership({ role: "space_admin" }),
    profile,
  };

  it("autorise un admin plateforme", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    await expect(
      requireSpaceManagerOrPlatform({ userId: "u1", roles: ["admin"] }, "sp1"),
    ).resolves.toEqual({ profile });
  });

  it("autorise un `space_admin` de l'espace", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    members.findMembership.mockResolvedValue(spaceAdmin.membership);
    await expect(
      requireSpaceManagerOrPlatform({ userId: "u1", roles: ["user"] }, "sp1"),
    ).resolves.toEqual({ profile });
  });

  it("refuse un membre ordinaire", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    members.findMembership.mockResolvedValue(membership({ role: "member" }));
    await expect(
      requireSpaceManagerOrPlatform({ userId: "u1", roles: ["user"] }, "sp1"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuse un utilisateur sans profil", async () => {
    profiles.findProfileByUserId.mockResolvedValue(null);
    await expect(
      requireSpaceManagerOrPlatform({ userId: "u1", roles: ["admin"] }, "sp1"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("configureAccessMethod (F15/F17)", () => {
  const adminCtx = { userId: "u1", roles: ["admin"] };
  const userCtx = { userId: "u1", roles: ["user"] };

  // Le repo renvoie la méthode sauvegardée avec la config qui lui est donnée.
  function saveWithConfig() {
    members.upsertAccessMethod.mockImplementation(async (_spaceId, method, config, isActive) =>
      accessMethod(method, config, isActive),
    );
  }

  it("`invite_code` avec code : stocke un hash, ne renvoie jamais le secret", async () => {
    saveWithConfig();

    const result = await configureAccessMethod(adminCtx, "sp1", "invite_code", {
      isActive: true,
      code: "SECRET-123",
    });

    expect(members.upsertAccessMethod).toHaveBeenCalledWith(
      "sp1",
      "invite_code",
      { codeHash: sha256("SECRET-123") },
      true,
    );
    expect(result.secret).toBeUndefined();
    expect(JSON.stringify(result.method.config)).not.toContain("SECRET-123");
  });

  it("`invite_code` + regenerate : renvoie le nouveau code une seule fois", async () => {
    saveWithConfig();

    const result = await configureAccessMethod(adminCtx, "sp1", "invite_code", {
      isActive: true,
      regenerate: true,
    });

    expect(result.secret).toBeDefined();
    expect(result.method.config.codeHash).toBe(sha256(result.secret!));
  });

  it("`invite_code` sans code ni régénération : conserve le hash existant", async () => {
    members.listAccessMethods.mockResolvedValue([
      accessMethod("invite_code", { codeHash: sha256("ancien-code") }),
    ]);
    saveWithConfig();

    const result = await configureAccessMethod(adminCtx, "sp1", "invite_code", { isActive: true });

    expect(members.upsertAccessMethod).toHaveBeenCalledWith(
      "sp1",
      "invite_code",
      { codeHash: sha256("ancien-code") },
      true,
    );
    expect(result.secret).toBeUndefined();
  });

  it("`invite_link` sans régénération : conserve le jeton existant (correctif)", async () => {
    const config = { tokenHash: sha256("jeton-existant"), expiresAt: "2999-01-01T00:00:00.000Z" };
    members.listAccessMethods.mockResolvedValue([accessMethod("invite_link", config)]);
    saveWithConfig();

    const result = await configureAccessMethod(adminCtx, "sp1", "invite_link", { isActive: true });

    expect(members.upsertAccessMethod).toHaveBeenCalledWith("sp1", "invite_link", config, true);
    expect(result.secret).toBeUndefined();
  });

  it("`invite_link` sans config existante : génère un lien dès l'activation", async () => {
    members.listAccessMethods.mockResolvedValue([]);
    saveWithConfig();

    const result = await configureAccessMethod(adminCtx, "sp1", "invite_link", { isActive: true });

    expect(result.secret).toBeDefined();
    expect(result.method.config.tokenHash).toBe(sha256(result.secret!));
    expect(typeof result.method.config.expiresAt).toBe("string");
  });

  it("`invite_link` + regenerate : nouveau jeton, nouveau secret", async () => {
    members.listAccessMethods.mockResolvedValue([
      accessMethod("invite_link", {
        tokenHash: sha256("ancien-jeton"),
        expiresAt: "2999-01-01T00:00:00.000Z",
      }),
    ]);
    saveWithConfig();

    const result = await configureAccessMethod(adminCtx, "sp1", "invite_link", {
      isActive: true,
      regenerate: true,
    });

    expect(result.secret).toBeDefined();
    expect(result.method.config.tokenHash).toBe(sha256(result.secret!));
    expect(result.method.config.tokenHash).not.toBe(sha256("ancien-jeton"));
  });

  it("`open` : aucune configuration n'est stockée", async () => {
    members.upsertAccessMethod.mockResolvedValue(accessMethod("open", {}));

    const result = await configureAccessMethod(adminCtx, "sp1", "open", { isActive: true });

    expect(members.upsertAccessMethod).toHaveBeenCalledWith("sp1", "open", {}, true);
    expect(result.secret).toBeUndefined();
  });

  it("refuse la configuration à un membre sans rôle de gestion", async () => {
    await expect(
      configureAccessMethod(userCtx, "sp1", "open", { isActive: true }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(members.upsertAccessMethod).not.toHaveBeenCalled();
  });
});
