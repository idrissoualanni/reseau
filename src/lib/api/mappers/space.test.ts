import { describe, expect, it } from "vitest";
import type { Membership, Profile, Space, SpaceAccessMethod, SpaceMember } from "@/lib/types";
import { toMembershipDto, toSpaceDetailDto, toSpaceMemberDto } from "./space";

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

const membership: Membership = {
  id: "m1",
  spaceId: "sp1",
  profileId: "p1",
  role: "member",
  verificationLevel: "unverified",
  verifiedVia: "open",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const space: Space = {
  id: "sp1",
  slug: "ucad",
  name: "UCAD",
  description: "Université",
  type: "university",
  visibility: "public",
  metadata: {},
  createdBy: "p-admin",
  archivedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const method = (kind: SpaceAccessMethod["method"], isActive = true): SpaceAccessMethod => ({
  id: `am-${kind}`,
  spaceId: "sp1",
  method: kind,
  config: {},
  isActive,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
});

describe("toMembershipDto (F15)", () => {
  it("sérialise le statut de vérification sans exposer les clés internes", () => {
    const dto = toMembershipDto(membership);
    expect(dto).toEqual({
      id: "m1",
      role: "member",
      verificationLevel: "unverified",
      verifiedVia: "open",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(dto).not.toHaveProperty("spaceId");
    expect(dto).not.toHaveProperty("profileId");
  });
});

describe("toSpaceMemberDto (F15)", () => {
  it("déduit le statut `pending` pour une demande non vérifiée", () => {
    const member: SpaceMember = {
      membership: { ...membership, verificationLevel: "unverified", verifiedVia: "manual_approval" },
      profile,
    };
    const dto = toSpaceMemberDto(member);
    expect(dto.status).toBe("pending");
    expect(dto.member).toBeDefined();
  });

  it("déduit le statut `active` pour une appartenance vérifiée", () => {
    const member: SpaceMember = {
      membership: { ...membership, verificationLevel: "verified", verifiedVia: "invite_code" },
      profile,
    };
    const dto = toSpaceMemberDto(member);
    expect(dto.status).toBe("active");
  });
});

describe("toSpaceDetailDto (F15)", () => {
  it("ne renvoie que les méthodes actives et n'expose pas la config", () => {
    const dto = toSpaceDetailDto(
      space,
      2,
      [method("open"), method("invite_code", false)],
      membership,
    );
    expect(dto.accessMethods).toEqual(["open"]);
    expect(dto).not.toHaveProperty("config");
    expect(dto).not.toHaveProperty("codeHash");
    expect(dto.membership).not.toBeNull();
  });

  it("renvoie null si aucun membre n'existe", () => {
    const dto = toSpaceDetailDto(space, 0, [method("open")], null);
    expect(dto.membership).toBeNull();
  });
});
