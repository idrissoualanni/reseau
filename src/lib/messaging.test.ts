import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repositories/messaging", () => ({
  deleteMessageReaction: vi.fn(),
  findContactRequestById: vi.fn(),
  findConversationByDirectKey: vi.fn(),
  findConversationById: vi.fn(),
  findConversationSummary: vi.fn(),
  findMessageById: vi.fn(),
  findMessageByClientId: vi.fn(),
  findParticipant: vi.fn(),
  findPendingContactRequest: vi.fn(),
  findProfileKey: vi.fn(),
  insertContactRequest: vi.fn(),
  insertDirectConversation: vi.fn(),
  insertMessage: vi.fn(),
  listConversationKeysForProfile: vi.fn(),
  listConversationsForProfile: vi.fn(),
  listMessages: vi.fn(),
  listParticipants: vi.fn(),
  listPendingContactRequestsForProfile: vi.fn(),
  listProfileKeys: vi.fn(),
  listReactionsForMessages: vi.fn(),
  markContactRequestResponded: vi.fn(),
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
  acceptContactRequest,
  declineContactRequest,
  directKeyFor,
  findDirectConversation,
  getConversationKeyBundle,
  listConversationMessages,
  listMyContactRequests,
  markConversationRead,
  publishOwnKey,
  reactToMessage,
  removeMessageReaction,
  requestContact,
  saveConversationKeys,
  sendMessage,
  startDirectConversation,
} from "@/lib/messaging";
import type {
  ContactRequest,
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

function contactRequest(overrides: Partial<ContactRequest> = {}): ContactRequest {
  return {
    id: "r1",
    requesterId: "p2",
    recipientId: "p1",
    status: "pending",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    respondedAt: null,
    ...overrides,
  };
}

describe("demandes de contact", () => {
  it("refuse une demande à soi-même", async () => {
    await expect(requestContact(ctx, "p1")).rejects.toBeInstanceOf(RuleViolationError);
  });

  it("refuse un profil inconnu", async () => {
    mockedProfiles.findProfileById.mockResolvedValue(null);
    await expect(requestContact(ctx, "p2")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuse une demande si une conversation existe déjà", async () => {
    mockedProfiles.findProfileById.mockResolvedValue(profile("p2"));
    mocked.findConversationByDirectKey.mockResolvedValue(conversation());
    await expect(requestContact(ctx, "p2")).rejects.toBeInstanceOf(ConflictError);
  });

  it("signale une demande inverse déjà en attente", async () => {
    mockedProfiles.findProfileById.mockResolvedValue(profile("p2"));
    mocked.findConversationByDirectKey.mockResolvedValue(null);
    mocked.findPendingContactRequest.mockImplementation(async (requesterId, recipientId) =>
      requesterId === "p2" && recipientId === "p1" ? contactRequest() : null,
    );
    await expect(requestContact(ctx, "p2")).rejects.toBeInstanceOf(ConflictError);
  });

  it("réutilise une demande sortante en attente", async () => {
    mockedProfiles.findProfileById.mockResolvedValue(profile("p2"));
    mocked.findConversationByDirectKey.mockResolvedValue(null);
    mocked.findPendingContactRequest.mockImplementation(async (requesterId, recipientId) =>
      requesterId === "p1" && recipientId === "p2"
        ? contactRequest({ requesterId: "p1", recipientId: "p2" })
        : null,
    );
    const result = await requestContact(ctx, "p2");
    expect(result.wasCreated).toBe(false);
    expect(mocked.insertContactRequest).not.toHaveBeenCalled();
  });

  it("crée une demande pour une nouvelle paire", async () => {
    mockedProfiles.findProfileById.mockResolvedValue(profile("p2"));
    mocked.findConversationByDirectKey.mockResolvedValue(null);
    mocked.findPendingContactRequest.mockResolvedValue(null);
    mocked.insertContactRequest.mockResolvedValue(
      contactRequest({ requesterId: "p1", recipientId: "p2" }),
    );
    const result = await requestContact(ctx, "p2");
    expect(result.wasCreated).toBe(true);
    expect(result.request.requesterId).toBe("p1");
  });

  it("n'ouvre pas une conversation inexistante", async () => {
    mocked.findConversationByDirectKey.mockResolvedValue(null);
    await expect(findDirectConversation(ctx, "p2")).resolves.toBeNull();
  });

  it("ouvre une conversation existante sans la recréer", async () => {
    mocked.findConversationByDirectKey.mockResolvedValue(conversation());
    mocked.findConversationSummary.mockResolvedValue(summary());
    const result = await findDirectConversation(ctx, "p2");
    expect(result?.conversation.id).toBe(conversationId);
    expect(mocked.insertDirectConversation).not.toHaveBeenCalled();
  });

  it("masque une demande dont on n'est pas le destinataire", async () => {
    mocked.findContactRequestById.mockResolvedValue(
      contactRequest({ recipientId: "p3" }),
    );
    await expect(acceptContactRequest(ctx, "r1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuse d'accepter une demande déjà refusée", async () => {
    mocked.findContactRequestById.mockResolvedValue(contactRequest({ status: "declined" }));
    await expect(acceptContactRequest(ctx, "r1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("accepte une demande et crée la conversation", async () => {
    mockedProfiles.findProfileById.mockResolvedValue(profile("p2"));
    mocked.findContactRequestById.mockResolvedValue(contactRequest());
    mocked.findConversationByDirectKey.mockResolvedValue(null);
    mocked.insertDirectConversation.mockResolvedValue(conversation());
    mocked.findConversationSummary.mockResolvedValue(summary());
    mocked.markContactRequestResponded.mockResolvedValue(
      contactRequest({ status: "accepted", respondedAt: new Date() }),
    );

    const result = await acceptContactRequest(ctx, "r1");
    expect(result.summary.conversation.id).toBe(conversationId);
    expect(mocked.markContactRequestResponded).toHaveBeenCalledWith(
      "r1",
      "p1",
      "accepted",
    );
  });

  it("reste idempotent sur une demande déjà acceptée", async () => {
    mocked.findContactRequestById.mockResolvedValue(contactRequest({ status: "accepted" }));
    mocked.findConversationByDirectKey.mockResolvedValue(conversation());
    mocked.findConversationSummary.mockResolvedValue(summary());
    const result = await acceptContactRequest(ctx, "r1");
    expect(result.summary.conversation.id).toBe(conversationId);
    expect(mocked.markContactRequestResponded).not.toHaveBeenCalled();
  });

  it("refuse de décliner une demande acceptée", async () => {
    mocked.findContactRequestById.mockResolvedValue(contactRequest({ status: "accepted" }));
    await expect(declineContactRequest(ctx, "r1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("décline une demande en attente", async () => {
    mocked.findContactRequestById.mockResolvedValue(contactRequest());
    mocked.markContactRequestResponded.mockResolvedValue(
      contactRequest({ status: "declined", respondedAt: new Date() }),
    );
    const result = await declineContactRequest(ctx, "r1");
    expect(result.status).toBe("declined");
  });

  it("liste les demandes en attente du profil", async () => {
    mocked.listPendingContactRequestsForProfile.mockResolvedValue([
      { request: contactRequest(), requester: profile("p2"), recipient: profile("p1") },
    ]);
    const result = await listMyContactRequests(ctx);
    expect(result).toHaveLength(1);
    expect(mocked.listPendingContactRequestsForProfile).toHaveBeenCalledWith("p1");
  });
});
