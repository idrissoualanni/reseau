import { describe, expect, it } from "vitest";
import { toAdminProfileDto, toSpaceDto, toAccessLogDto } from "./admin";
import type { AdminAccessLogRecord, AdminProfileRecord, Profile, Space } from "@/lib/types";

const profile: Profile = {
  id: "p1",
  userId: "u1-secret",
  username: "awa",
  displayName: "Awa Diop",
  bio: null,
  schoolName: null,
  fieldOfStudy: null,
  avatarKey: "profiles/secret-key.png",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const space: Space = {
  id: "sp1",
  slug: "ucad",
  name: "UCAD",
  description: "Université",
  type: "university",
  visibility: "private",
  metadata: {},
  createdBy: "p1",
  archivedAt: new Date("2026-02-01T00:00:00Z"),
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-02T00:00:00Z"),
};

describe("toAdminProfileDto (F17)", () => {
  it("n'expose ni userId ni clé de stockage", () => {
    const record: AdminProfileRecord = { profile, postCount: 3, projectCount: 1 };
    const dto = toAdminProfileDto(record);
    expect(dto).not.toHaveProperty("userId");
    expect(dto).not.toHaveProperty("avatarKey");
    expect(dto.avatarUrl).not.toBe("profiles/secret-key.png");
    expect(dto.postCount).toBe(3);
  });
});

describe("toSpaceDto (F14)", () => {
  it("sérialise les dates et l'état d'archivage", () => {
    const dto = toSpaceDto(space, 7);
    expect(dto.archived).toBe(true);
    expect(dto.memberCount).toBe(7);
    expect(dto.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(dto).not.toHaveProperty("metadata");
  });
});

describe("toAccessLogDto", () => {
  it("projette une entrée avec profil optionnel", () => {
    const record: AdminAccessLogRecord = {
      entry: {
        id: "l1",
        spaceId: "sp1",
        profileId: null,
        method: null,
        action: "join",
        createdAt: new Date("2026-01-03T00:00:00Z"),
      },
      space: { id: "sp1", slug: "ucad", name: "UCAD" },
      profile: null,
    };
    const dto = toAccessLogDto(record);
    expect(dto.profile).toBeNull();
    expect(dto.action).toBe("join");
    expect(dto.createdAt).toBe("2026-01-03T00:00:00.000Z");
  });
});
