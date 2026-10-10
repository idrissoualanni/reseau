import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repositories/profiles", () => ({
  findProfileByUserId: vi.fn(),
  findProfileByUsername: vi.fn(),
  insertProfile: vi.fn(),
  isUsernameTaken: vi.fn(),
  updateProfileById: vi.fn(),
}));

vi.mock("@/lib/repositories/skills", () => ({
  listSkillsForProfile: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  avatarPrefix: (profileId: string) => `profiles/${profileId}/`,
  getPublicUrl: () => null,
}));

import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import * as repo from "@/lib/repositories/profiles";
import * as skillsRepo from "@/lib/repositories/skills";
import {
  createProfile,
  getPublicProfile,
  isUsernameAvailable,
  requireOwnProfile,
  updateProfile,
} from "@/lib/profile";
import type { Profile, ProfileSkill } from "@/lib/types";

const mocked = vi.mocked(repo);
const mockedSkills = vi.mocked(skillsRepo);

const existing: Profile = {
  id: "p1",
  userId: "u1",
  username: "awa_diop",
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
});

describe("createProfile (F03)", () => {
  it("crée le profil quand le compte n'en a pas encore", async () => {
    mocked.findProfileByUserId.mockResolvedValue(null);
    mocked.insertProfile.mockResolvedValue(existing);

    const profile = await createProfile("u1", { username: "awa_diop", displayName: "Awa Diop" });

    expect(profile.username).toBe("awa_diop");
    expect(mocked.insertProfile).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", username: "awa_diop", bio: null }),
    );
  });

  it("refuse un second profil pour le même compte", async () => {
    mocked.findProfileByUserId.mockResolvedValue(existing);

    await expect(
      createProfile("u1", { username: "awa_diop", displayName: "Awa Diop" }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(mocked.insertProfile).not.toHaveBeenCalled();
  });
});

describe("isUsernameAvailable (F03)", () => {
  it("refuse un nom réservé sans interroger la base", async () => {
    expect(await isUsernameAvailable("admin")).toBe(false);
    expect(mocked.isUsernameTaken).not.toHaveBeenCalled();
  });

  it("dit disponible quand le nom est libre", async () => {
    mocked.isUsernameTaken.mockResolvedValue(false);
    expect(await isUsernameAvailable("awa_diop")).toBe(true);
  });

  it("dit indisponible quand le nom est pris", async () => {
    mocked.isUsernameTaken.mockResolvedValue(true);
    expect(await isUsernameAvailable("awa_diop")).toBe(false);
  });
});

describe("updateProfile (F10)", () => {
  it("lève NOT_FOUND si le profil n'existe pas", async () => {
    mocked.updateProfileById.mockResolvedValue(null);
    await expect(updateProfile("u1", { displayName: "Awa" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("renvoie le profil mis à jour", async () => {
    mocked.updateProfileById.mockResolvedValue({ ...existing, displayName: "Awa D." });
    await expect(updateProfile("u1", { displayName: "Awa D." })).resolves.toMatchObject({
      displayName: "Awa D.",
    });
  });
});

describe("updateProfile — appartenance avatar (F13)", () => {
  it("accepte une clé d'avatar préfixée par l'id du profil", async () => {
    mocked.findProfileByUserId.mockResolvedValue(existing);
    mocked.updateProfileById.mockResolvedValue({
      ...existing,
      avatarKey: "profiles/p1/photo.png",
    });

    await expect(
      updateProfile("u1", { avatarKey: "profiles/p1/photo.png" }),
    ).resolves.toMatchObject({ avatarKey: "profiles/p1/photo.png" });
    expect(mocked.updateProfileById).toHaveBeenCalledWith("u1", {
      avatarKey: "profiles/p1/photo.png",
    });
  });

  it("refuse une clé d'avatar d'un autre profil", async () => {
    mocked.findProfileByUserId.mockResolvedValue(existing);

    await expect(
      updateProfile("u1", { avatarKey: "profiles/p2/photo.png" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(mocked.updateProfileById).not.toHaveBeenCalled();
  });

  it("retire l'avatar (null) sans vérifier le préfixe", async () => {
    mocked.updateProfileById.mockResolvedValue({ ...existing, avatarKey: null });

    await expect(updateProfile("u1", { avatarKey: null })).resolves.toMatchObject({
      avatarKey: null,
    });
  });
});

describe("requireOwnProfile", () => {
  it("expose le profil existant et lève sinon", async () => {
    mocked.findProfileByUserId.mockResolvedValue(existing);
    await expect(requireOwnProfile("u1")).resolves.toMatchObject({ username: "awa_diop" });

    mocked.findProfileByUserId.mockResolvedValue(null);
    await expect(requireOwnProfile("u2")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("getPublicProfile (F08)", () => {
  it("renvoie null quand le username est inconnu, sans charger les compétences", async () => {
    mocked.findProfileByUsername.mockResolvedValue(null);

    await expect(getPublicProfile("inconnu")).resolves.toBeNull();
    expect(mockedSkills.listSkillsForProfile).not.toHaveBeenCalled();
  });

  it("assemble le profil et ses compétences pour un membre existant", async () => {
    const skill: ProfileSkill = {
      id: "s1",
      slug: "react",
      name: "React",
      proofLevel: "demonstrated",
    };
    mocked.findProfileByUsername.mockResolvedValue(existing);
    mockedSkills.listSkillsForProfile.mockResolvedValue([skill]);

    const result = await getPublicProfile("awa_diop");

    expect(result).toEqual({ profile: existing, skills: [skill] });
    expect(mockedSkills.listSkillsForProfile).toHaveBeenCalledWith("p1");
  });
});
