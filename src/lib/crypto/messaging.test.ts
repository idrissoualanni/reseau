import { describe, expect, it } from "vitest";
import {
  decryptMessage,
  decryptReaction,
  encryptMessage,
  encryptReaction,
  generateIdentity,
  importPublicKey,
  messageAad,
  reactionAad,
  unwrapConversationKey,
  wrapConversationKey,
} from "@/lib/crypto/messaging";

const conversationId = "00000000-0000-0000-0000-0000000000c1";
const messageId = "00000000-0000-0000-0000-0000000000a1";
const senderId = "00000000-0000-0000-0000-000000000001";
const recipientId = "00000000-0000-0000-0000-000000000002";

async function pair() {
  const sender = await generateIdentity(senderId);
  const recipient = await generateIdentity(recipientId);
  return { sender, recipient };
}

describe("crypto messagerie E2E", () => {
  it("génère une clé publique P-256 et un keyId stable", async () => {
    const identity = await generateIdentity(senderId);
    expect(identity.publicKeyJwk.kty).toBe("EC");
    expect(identity.publicKeyJwk.crv).toBe("P-256");
    expect(identity.keyId).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(identity.privateKey.extractable).toBe(false);
    await expect(crypto.subtle.exportKey("jwk", identity.privateKey)).rejects.toThrow();
  });

  it("enveloppe et désenveloppe la clé de conversation", async () => {
    const { sender, recipient } = await pair();
    const raw = crypto.getRandomValues(new Uint8Array(32));
    const wrapped = await wrapConversationKey(
      raw,
      sender.privateKey,
      {
        profileId: recipientId,
        keyId: recipient.keyId,
        publicKeyJwk: recipient.publicKeyJwk,
      },
      conversationId,
    );

    const key = await unwrapConversationKey(
      recipient.privateKey,
      {
        profileId: senderId,
        keyId: sender.keyId,
        publicKeyJwk: sender.publicKeyJwk,
      },
      { profileId: recipientId, keyId: recipient.keyId, ...wrapped },
      conversationId,
    );

    const aad = messageAad({ conversationId, messageId, senderId, keyVersion: 1 });
    const envelope = await encryptMessage(key, "Bonjour", aad);
    expect(await decryptMessage(key, envelope, aad)).toBe("Bonjour");
  });

  it("refuse une AAD falsifiée", async () => {
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
      "encrypt",
      "decrypt",
    ]);
    const aad = messageAad({ conversationId, messageId, senderId, keyVersion: 1 });
    const envelope = await encryptMessage(key, "secret", aad);

    await expect(
      decryptMessage(
        key,
        envelope,
        messageAad({ conversationId, messageId, senderId: recipientId, keyVersion: 1 }),
      ),
    ).rejects.toThrow();
  });

  it("chiffre une réaction avec une AAD distincte", async () => {
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
      "encrypt",
      "decrypt",
    ]);
    const aad = reactionAad({ messageId, profileId: senderId, keyVersion: 1 });
    const envelope = await encryptReaction(key, "🔥", aad);
    expect(await decryptReaction(key, envelope, aad)).toBe("🔥");
  });

  it("refuse la désenveloppe avec une autre clé privée", async () => {
    const { sender, recipient } = await pair();
    const intruder = await generateIdentity("00000000-0000-0000-0000-000000000003");
    const wrapped = await wrapConversationKey(
      crypto.getRandomValues(new Uint8Array(32)),
      sender.privateKey,
      {
        profileId: recipientId,
        keyId: recipient.keyId,
        publicKeyJwk: recipient.publicKeyJwk,
      },
      conversationId,
    );

    await expect(
      unwrapConversationKey(
        intruder.privateKey,
        {
          profileId: senderId,
          keyId: sender.keyId,
          publicKeyJwk: sender.publicKeyJwk,
        },
        { profileId: recipientId, keyId: recipient.keyId, ...wrapped },
        conversationId,
      ),
    ).rejects.toThrow();
  });

  it("importe une clé publique sans usage de signature", async () => {
    const identity = await generateIdentity(senderId);
    const publicKey = await importPublicKey(identity.publicKeyJwk);
    expect(publicKey.type).toBe("public");
    expect(publicKey.extractable).toBe(false);
  });
});
