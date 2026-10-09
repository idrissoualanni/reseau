import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repositories/profiles", () => ({
  findProfileByUserId: vi.fn(),
  findProfileByUsername: vi.fn(),
  insertProfile: vi.fn(),
  isUsernameTaken: vi.fn(),
  updateProfileById: vi.fn(),
}));

import { ConflictError, NotFoundError } from "@/lib/errors";
import * as repo from "@/lib/repositories/profiles";
import { createProfile, isUsernameAvailable, requireOwnProfile, updateProfile } from "@/lib/profile";
import type { Profile } from "@/lib/types";

const mocked = vi.mocked(repo);

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

describe("requireOwnProfile", () => {
  it("expose le profil existant et lève sinon", async () => {
    mocked.findProfileByUserId.mockResolvedValue(existing);
    await expect(requireOwnProfile("u1")).resolves.toMatchObject({ username: "awa_diop" });

    mocked.findProfileByUserId.mockResolvedValue(null);
    await expect(requireOwnProfile("u2")).rejects.toBeInstanceOf(NotFoundError);
  });
});
