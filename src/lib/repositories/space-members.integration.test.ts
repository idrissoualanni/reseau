import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { memberships, profiles, spaceAccessLog, spaceAccessMethods, spaces } from "@/db/schema";
import { ConflictError } from "@/lib/errors";
import { insertProfile } from "@/lib/repositories/profiles";
import { insertSpace } from "@/lib/repositories/spaces";
import {
  insertAccessLog,
  insertMembership,
  listMembershipsForSpace,
  upsertAccessMethod,
} from "@/lib/repositories/space-members";

// Intégration base réelle, opt-in uniquement (testing.md §6) : branche Neon
// `dev` seulement, jamais la production. Sans DATABASE_URL + NEON_BRANCH=dev +
// SPACE_MEMBERS_DB_INTEGRATION=1, tout le fichier est ignoré (justification §10).
const dbOptIn =
  Boolean(process.env.DATABASE_URL) &&
  process.env.NEON_BRANCH === "dev" &&
  process.env.SPACE_MEMBERS_DB_INTEGRATION === "1";

describe.skipIf(!dbOptIn)("space-members (base réelle dev, opt-in)", () => {
  // Suffixe unique : isole les données de ce test des données existantes.
  const suffix = randomUUID().slice(0, 8);
  const username = `qa_membre_${suffix}`;
  const slug = `qa-space-${suffix}`;

  let spaceId: string;
  let profileId: string;

  beforeAll(async () => {
    const profile = await insertProfile({
      userId: `qa_user_${suffix}`,
      username,
      displayName: "QA Membre",
    });
    profileId = profile.id;

    const space = await insertSpace(
      { slug, name: "Espace QA", type: "university", visibility: "public" },
      profileId,
    );
    spaceId = space.id;
  });

  afterAll(async () => {
    // Purge scopée : uniquement les lignes créées par ce fichier.
    // Ordre enfants → parents pour respecter les clés étrangères.
    await db.delete(spaceAccessLog).where(eq(spaceAccessLog.spaceId, spaceId));
    await db.delete(memberships).where(eq(memberships.spaceId, spaceId));
    await db.delete(spaceAccessMethods).where(eq(spaceAccessMethods.spaceId, spaceId));
    await db.delete(spaces).where(eq(spaces.id, spaceId));
    await db.delete(profiles).where(eq(profiles.id, profileId));
  });

  it("refuse une seconde appartenance pour le même (espace, profil)", async () => {
    const first = await insertMembership({
      spaceId,
      profileId,
      verificationLevel: "unverified",
      verifiedVia: "open",
    });

    await expect(
      insertMembership({
        spaceId,
        profileId,
        verificationLevel: "verified",
        verifiedVia: "invite_code",
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    await db.delete(memberships).where(eq(memberships.id, first.id));
  });

  it("listMembershipsForSpace renvoie l'appartenance jointe à son profil", async () => {
    const created = await insertMembership({
      spaceId,
      profileId,
      verificationLevel: "verified",
      verifiedVia: "invite_code",
    });

    const members = await listMembershipsForSpace(spaceId);

    expect(members).toHaveLength(1);
    expect(members[0]!.membership.id).toBe(created.id);
    expect(members[0]!.membership.spaceId).toBe(spaceId);
    expect(members[0]!.profile.id).toBe(profileId);
    expect(members[0]!.profile.username).toBe(username);

    await db.delete(memberships).where(eq(memberships.id, created.id));
  });

  it("upsertAccessMethod insère puis met à jour la configuration", async () => {
    const created = await upsertAccessMethod(spaceId, "invite_code", { codeHash: "a" }, true);
    const updated = await upsertAccessMethod(spaceId, "invite_code", { codeHash: "b" }, false);

    expect(updated.id).toBe(created.id);
    expect(updated.config).toEqual({ codeHash: "b" });
    expect(updated.isActive).toBe(false);
  });

  it("insertAccessLog journalise une ligne scopée à l'espace", async () => {
    await insertAccessLog({ spaceId, profileId, method: "open", action: "request" });

    const rows = await db
      .select({ action: spaceAccessLog.action, method: spaceAccessLog.method })
      .from(spaceAccessLog)
      .where(and(eq(spaceAccessLog.spaceId, spaceId), eq(spaceAccessLog.profileId, profileId)));

    expect(rows).toEqual([{ action: "request", method: "open" }]);
  });
});
