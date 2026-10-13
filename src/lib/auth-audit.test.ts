import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repositories/auth-audit", () => ({
  insertOtpEvent: vi.fn(),
  listOtpEvents: vi.fn(),
}));

vi.mock("@/lib/repositories/profiles", () => ({
  findProfileById: vi.fn(),
  findProfileByUserId: vi.fn(),
  findProfileByUsername: vi.fn(),
}));

import { listOtpEventsForAdmin, recordOtpSend } from "@/lib/auth-audit";
import { type AdminContext } from "@/lib/admin";
import { ForbiddenError } from "@/lib/errors";
import * as auditRepo from "@/lib/repositories/auth-audit";
import * as profilesRepo from "@/lib/repositories/profiles";
import type { AdminOtpEventRecord, Profile } from "@/lib/types";

const audit = vi.mocked(auditRepo);
const profiles = vi.mocked(profilesRepo);

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

const event: AdminOtpEventRecord = {
  id: "o1",
  email: "awa@example.com",
  type: "email-verification",
  outcome: "sent",
  errorCode: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("recordOtpSend (F17)", () => {
  it("trace un envoi réussi (adresse normalisée, aucun code)", async () => {
    audit.insertOtpEvent.mockResolvedValue(undefined);

    await recordOtpSend({ email: "  Awa@Example.COM ", type: "email-verification", ok: true });

    expect(audit.insertOtpEvent).toHaveBeenCalledWith({
      email: "awa@example.com",
      type: "email-verification",
      outcome: "sent",
      errorCode: null,
    });
  });

  it("trace un échec avec le code d'erreur (jamais le code OTP)", async () => {
    audit.insertOtpEvent.mockResolvedValue(undefined);

    await recordOtpSend({
      email: "awa@example.com",
      type: "forgot-password",
      ok: false,
      errorCode: "RATE_LIMITED",
    });

    expect(audit.insertOtpEvent).toHaveBeenCalledWith({
      email: "awa@example.com",
      type: "forgot-password",
      outcome: "failed",
      errorCode: "RATE_LIMITED",
    });
  });

  it("best-effort : une panne d'audit ne remonte jamais", async () => {
    audit.insertOtpEvent.mockRejectedValue(new Error("db down"));

    await expect(
      recordOtpSend({ email: "awa@example.com", type: "email-verification", ok: true }),
    ).resolves.toBeUndefined();
  });
});

describe("listOtpEventsForAdmin (F17)", () => {
  it("refuse un membre ordinaire", async () => {
    await expect(listOtpEventsForAdmin(userCtx)).rejects.toBeInstanceOf(ForbiddenError);
    expect(audit.listOtpEvents).not.toHaveBeenCalled();
  });

  it("renvoie le journal pour un admin", async () => {
    profiles.findProfileByUserId.mockResolvedValue(profile);
    audit.listOtpEvents.mockResolvedValue([event]);

    await expect(listOtpEventsForAdmin(adminCtx)).resolves.toEqual([event]);
  });
});
