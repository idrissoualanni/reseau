import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repositories/messaging", () => ({
  deleteMessageReaction: vi.fn(),
  findConversationByDirectKey: vi.fn(),
  findConversationById: vi.fn(),
  findConversationSummary: vi.fn(),
  findMessageById: vi.fn(),
  findMessageByClientId: vi.fn(),
  findParticipant: vi.fn(),
  findProfileKey: vi.fn(),
  insertDirectConversation: vi.fn(),
  insertMessage: vi.fn(),
  listConversationKeysForProfile: vi.fn(),
  listConversationsForProfile: vi.fn(),
  listMessages: vi.fn(),
  listParticipants: vi.fn(),
  listProfileKeys: vi.fn(),
  listReactionsForMessages: vi.fn(),
  markMessageDelivered: vi.fn(),
  updateParticipantReadAt: vi.fn(),
  upsertConversationKeys: vi.fn(),
  upsertMessageReaction: vi.fn(),
  upsertProfileKey: vi.fn(),
}));

vi.mock("@/lib/repositories/profiles", () => ({
  findProfileById: vi.fn(),
}));

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RuleViolationError,
} from "@/lib/errors";
import * as profilesRepo from "@/lib/repositories/profiles";
import * as repo from "@/lib/repositories/messaging";
import {
  directKeyFor,
  getConversationKeyBundle,
  listConversationMessages,
  markConversationRead,
  publishOwnKey,
  reactToMessage,
  removeMessageReaction,
  saveConversationKeys,
  sendMessage,
  startDirectConversation,
} from "@/lib/messaging";
import type {
  Conversation,
  ConversationKey,
  ConversationSummary,
  EncryptedMessage,
  Profile,
  ProfileKey,
} from "@/lib/types";

const mocked = vi.mocked(repo);
const mockedProfiles = vi.mocked(profilesRepo);

const ctx = { userId: "u1", profileId: "p1" };
const other = "p2";
const conversationId = "c1";

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: conversationId,
    kind: "direct",
    directKey: "p1:p2",
    createdBy: "p1",
    lastMessageAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function profile(id: string): Profile {
  return {
    id,
    userId: `user-${id}`,
    username: id,
    displayName: id,
    bio: null,
    schoolName: null,
    fieldOfStudy: null,
    avatarKey: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
}

function summary(): ConversationSummary {
  return {
    conversation: conversation(),
    participants: [
      { participant: { conversationId, profileId: "p1", role: "owner", lastReadAt: new Date(), joinedAt: new Date() }, profile: profile("p1") },
      { participant: { conversationId, profileId: "p2", role: "member", lastReadAt: new Date(), joinedAt: new Date() }, profile: profile("p2") },
    ],
    lastMessage: null,
    unreadCount: 0,
  };
}

function message(overrides: Partial<EncryptedMessage> = {}): EncryptedMessage {
  return {
    id: "m1",
    conversationId,
    senderId: "p1",
    clientId: "00000000-0000-0000-0000-000000000001",
    ciphertext: "AAAA",
    iv: "AAAAAAAAAAAAAAAA",
    keyVersion: 1,
    senderKeyId: "k1",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    editedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

function profileKey(overrides: Partial<ProfileKey> = {}): ProfileKey {
  return {
    profileId: "p1",
    keyId: "k1",
    publicKeyJwk: { kty: "EC", crv: "P-256", x: "a".repeat(43), y: "b".repeat(43) },
    algorithm: "ECDH-P256",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    rotatedAt: null,
    ...overrides,
  };
}

function wrappedKey(profileId: string): ConversationKey {
  return {
    conversationId,
    profileId,
    keyId: "k1",
    wrappedKey: "AAAA",
    iv: "AAAAAAAAAAAAAAAA",
    algorithm: "AES-256-GCM",
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };
}

function members() {
  return [
    { participant: { conversationId, profileId: "p1", role: "owner" as const, lastReadAt: new Date(), joinedAt: new Date() }, profile: profile("p1") },
    { participant: { conversationId, profileId: "p2", role: "member" as const, lastReadAt: new Date(), joinedAt: new Date() }, profile: profile("p2") },
  ];
}

beforeEach(() => {
  vi.resetAllMocks();
  mocked.findConversationById.mockResolvedValue(conversation());
  mocked.findParticipant.mockResolvedValue({
    conversationId,
    profileId: "p1",
    role: "owner",
    lastReadAt: new Date(),
    joinedAt: new Date(),
  });
});

describe("clé directe", () => {
  it("est stable quel que soit l'ordre des profils", () => {
    expect(directKeyFor("p2", "p1")).toBe(directKeyFor("p1", "p2"));
  });
});

describe("startDirectConversation", () => {
  it("refuse de démarrer avec soi-même", async () => {
    await expect(startDirectConversation(ctx, "p1")).rejects.toBeInstanceOf(RuleViolationError);
  });

  it("refuse un profil inconnu", async () => {
    mockedProfiles.findProfileById.mockResolvedValue(null);
    await expect(startDirectConversation(ctx, other)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("crée la conversation et signale la création", async () => {
    mockedProfiles.findProfileById.mockResolvedValue(profile(other));
    mocked.findConversationByDirectKey.mockResolvedValue(null);
    mocked.insertDirectConversation.mockResolvedValue(conversation());
    mocked.findConversationSummary.mockResolvedValue(summary());

    const result = await startDirectConversation(ctx, other);

    expect(result.wasCreated).toBe(true);
    expect(mocked.insertDirectConversation).toHaveBeenCalledWith("p1", ["p1", "p2"], "p1:p2");
  });

  it("réutilise une conversation existante", async () => {
    mockedProfiles.findProfileById.mockResolvedValue(profile(other));
    mocked.findConversationByDirectKey.mockResolvedValue(conversation());
    mocked.findConversationSummary.mockResolvedValue(summary());

    const result = await startDirectConversation(ctx, other);

    expect(result.wasCreated).toBe(false);
    expect(mocked.insertDirectConversation).not.toHaveBeenCalled();
  });
});

describe("listConversationMessages", () => {
  it("refuse un non-membre", async () => {
    mocked.findParticipant.mockResolvedValue(null);
    await expect(listConversationMessages(ctx, conversationId, 20)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("pagine avec un curseur quand il y a une ligne de plus", async () => {
    const first = message({ id: "m1", createdAt: new Date("2026-01-01T00:00:00Z") });
    const second = message({ id: "m2", createdAt: new Date("2026-01-02T00:00:00Z") });
    mocked.listMessages.mockResolvedValue([first, second, message({ id: "m3" })]);
    mocked.listReactionsForMessages.mockResolvedValue([]);

    const result = await listConversationMessages(ctx, conversationId, 2);

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
    expect(mocked.listMessages).toHaveBeenCalledWith(conversationId, 2, undefined);
  });
});

describe("sendMessage", () => {
  it("refuse un non-membre", async () => {
    mocked.findParticipant.mockResolvedValue(null);
    await expect(
      sendMessage(ctx, conversationId, {
        clientId: "00000000-0000-0000-0000-000000000001",
        ciphertext: "AAAA",
        iv: "AAAAAAAAAAAAAAAA",
        keyVersion: 1,
        senderKeyId: "k1",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("renvoie le message existant pour le même clientId", async () => {
    mocked.findMessageByClientId.mockResolvedValue(message());
    const result = await sendMessage(ctx, conversationId, {
      clientId: "00000000-0000-0000-0000-000000000001",
      ciphertext: "AAAA",
      iv: "AAAAAAAAAAAAAAAA",
      keyVersion: 1,
      senderKeyId: "k1",
    });
    expect(result.id).toBe("m1");
    expect(mocked.insertMessage).not.toHaveBeenCalled();
  });

  it("refuse un clientId réutilisé dans une autre conversation", async () => {
    mocked.findMessageByClientId.mockResolvedValue(message({ conversationId: "c2" }));
    await expect(
      sendMessage(ctx, conversationId, {
        clientId: "00000000-0000-0000-0000-000000000001",
        ciphertext: "AAAA",
        iv: "AAAAAAAAAAAAAAAA",
        keyVersion: 1,
        senderKeyId: "k1",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("exige une clé publique publiée", async () => {
    mocked.findProfileKey.mockResolvedValue(null);
    await expect(
      sendMessage(ctx, conversationId, {
        clientId: "00000000-0000-0000-0000-000000000001",
        ciphertext: "AAAA",
        iv: "AAAAAAAAAAAAAAAA",
        keyVersion: 1,
        senderKeyId: "k1",
      }),
    ).rejects.toBeInstanceOf(RuleViolationError);
  });

  it("refuse une clé d'envoi qui ne correspond pas", async () => {
    mocked.findProfileKey.mockResolvedValue(profileKey());
    await expect(
      sendMessage(ctx, conversationId, {
        clientId: "00000000-0000-0000-0000-000000000001",
        ciphertext: "AAAA",
        iv: "AAAAAAAAAAAAAAAA",
        keyVersion: 1,
        senderKeyId: "k2",
      }),
    ).rejects.toBeInstanceOf(RuleViolationError);
  });

  it("exige les clés enveloppées de tous les participants", async () => {
    mocked.findProfileKey.mockResolvedValue(profileKey());
    mocked.listParticipants.mockResolvedValue(members());
    mocked.listConversationKeysForProfile.mockImplementation(async (_id, profileId) =>
      profileId === "p1" ? [wrappedKey("p1")] : [],
    );

    await expect(
      sendMessage(ctx, conversationId, {
        clientId: "00000000-0000-0000-0000-000000000001",
        ciphertext: "AAAA",
        iv: "AAAAAAAAAAAAAAAA",
        keyVersion: 1,
        senderKeyId: "k1",
      }),
    ).rejects.toBeInstanceOf(RuleViolationError);
    expect(mocked.insertMessage).not.toHaveBeenCalled();
  });

  it("insère le message et marque les destinataires comme livrés", async () => {
    mocked.findProfileKey.mockResolvedValue(profileKey());
    mocked.listParticipants.mockResolvedValue(members());
    mocked.listConversationKeysForProfile.mockResolvedValue([wrappedKey("p1")]);
    mocked.insertMessage.mockResolvedValue(message());
    mocked.markMessageDelivered.mockResolvedValue(undefined);

    const result = await sendMessage(ctx, conversationId, {
      clientId: "00000000-0000-0000-0000-000000000001",
      ciphertext: "AAAA",
      iv: "AAAAAAAAAAAAAAAA",
      keyVersion: 1,
      senderKeyId: "k1",
    });

    expect(result.id).toBe("m1");
    expect(mocked.insertMessage).toHaveBeenCalledWith({
      conversationId,
      senderId: "p1",
      clientId: "00000000-0000-0000-0000-000000000001",
      ciphertext: "AAAA",
      iv: "AAAAAAAAAAAAAAAA",
      keyVersion: 1,
      senderKeyId: "k1",
    });
    expect(mocked.markMessageDelivered).toHaveBeenCalledWith("m1", "p2");
    expect(mocked.markMessageDelivered).not.toHaveBeenCalledWith("m1", "p1");
  });
});

describe("lecture et réactions", () => {
  it("met à jour la date de lecture du membre", async () => {
    mocked.updateParticipantReadAt.mockResolvedValue(true);
    const result = await markConversationRead(ctx, conversationId);
    expect(result.conversationId).toBe(conversationId);
    expect(mocked.updateParticipantReadAt).toHaveBeenCalled();
  });

  it("refuse une réaction sur un message hors conversation", async () => {
    mocked.findMessageById.mockResolvedValue(message({ conversationId: "c2" }));
    mocked.findParticipant.mockResolvedValue(null);
    await expect(
      reactToMessage(ctx, "m1", { ciphertext: "AAAA", iv: "AAAAAAAAAAAAAAAA", keyVersion: 1 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("supprime la réaction du membre courant", async () => {
    mocked.findMessageById.mockResolvedValue(message());
    mocked.deleteMessageReaction.mockResolvedValue(true);
    await removeMessageReaction(ctx, "m1");
    expect(mocked.deleteMessageReaction).toHaveBeenCalledWith("m1", "p1");
  });
});

describe("clés", () => {
  it("publie une clé absente", async () => {
    mocked.findProfileKey.mockResolvedValue(null);
    mocked.upsertProfileKey.mockResolvedValue(profileKey());
    const result = await publishOwnKey(ctx, {
      keyId: "k1",
      publicKeyJwk: { kty: "EC", crv: "P-256", x: "a".repeat(43), y: "b".repeat(43) },
    });
    expect(result.keyId).toBe("k1");
  });

  it("refuse de remplacer une clé existante", async () => {
    mocked.findProfileKey.mockResolvedValue(profileKey());
    await expect(
      publishOwnKey(ctx, {
        keyId: "k2",
        publicKeyJwk: { kty: "EC", crv: "P-256", x: "a".repeat(43), y: "b".repeat(43) },
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("est idempotent pour la même clé", async () => {
    mocked.findProfileKey.mockResolvedValue(profileKey());
    const result = await publishOwnKey(ctx, {
      keyId: "k1",
      publicKeyJwk: { kty: "EC", crv: "P-256", x: "a".repeat(43), y: "b".repeat(43) },
    });
    expect(result.keyId).toBe("k1");
    expect(mocked.upsertProfileKey).not.toHaveBeenCalled();
  });

  it("réserve la configuration des clés au créateur", async () => {
    mocked.findConversationById.mockResolvedValue(conversation({ createdBy: "p2" }));
    await expect(
      saveConversationKeys(ctx, conversationId, [
        { profileId: "p1", keyId: "k1", wrappedKey: "AAAA", iv: "AAAAAAAAAAAAAAAA" },
        { profileId: "p2", keyId: "k1", wrappedKey: "AAAA", iv: "AAAAAAAAAAAAAAAA" },
      ]),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("exige une clé pour chaque participant", async () => {
    mocked.listParticipants.mockResolvedValue(members());
    mocked.listProfileKeys.mockResolvedValue([profileKey({ profileId: "p1" }), profileKey({ profileId: "p2" })]);
    await expect(
      saveConversationKeys(ctx, conversationId, [
        { profileId: "p1", keyId: "k1", wrappedKey: "AAAA", iv: "AAAAAAAAAAAAAAAA" },
      ]),
    ).rejects.toBeInstanceOf(RuleViolationError);
  });

  it("refuse une clé enveloppée dont le keyId diffère", async () => {
    mocked.listParticipants.mockResolvedValue(members());
    mocked.listProfileKeys.mockResolvedValue([profileKey({ profileId: "p1" }), profileKey({ profileId: "p2" })]);
    await expect(
      saveConversationKeys(ctx, conversationId, [
        { profileId: "p1", keyId: "k2", wrappedKey: "AAAA", iv: "AAAAAAAAAAAAAAAA" },
        { profileId: "p2", keyId: "k1", wrappedKey: "AAAA", iv: "AAAAAAAAAAAAAAAA" },
      ]),
    ).rejects.toBeInstanceOf(RuleViolationError);
  });

  it("enregistre le lot complet", async () => {
    mocked.listParticipants.mockResolvedValue(members());
    mocked.listProfileKeys.mockResolvedValue([profileKey({ profileId: "p1" }), profileKey({ profileId: "p2" })]);
    mocked.upsertConversationKeys.mockResolvedValue([wrappedKey("p1"), wrappedKey("p2")]);
    const result = await saveConversationKeys(ctx, conversationId, [
      { profileId: "p1", keyId: "k1", wrappedKey: "AAAA", iv: "AAAAAAAAAAAAAAAA" },
      { profileId: "p2", keyId: "k1", wrappedKey: "AAAA", iv: "AAAAAAAAAAAAAAAA" },
    ]);
    expect(result).toHaveLength(2);
  });

  it("ne renvoie jamais les clés privées dans le bundle", async () => {
    mocked.listParticipants.mockResolvedValue(members());
    mocked.listProfileKeys.mockResolvedValue([profileKey({ profileId: "p1" }), profileKey({ profileId: "p2" })]);
    mocked.listConversationKeysForProfile.mockResolvedValue([wrappedKey("p1")]);
    const bundle = await getConversationKeyBundle(ctx, conversationId);
    expect(bundle.participantKeys.every((key) => !("privateKey" in key))).toBe(true);
  });
});
