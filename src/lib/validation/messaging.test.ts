import { describe, expect, it } from "vitest";
import {
  createDirectConversationSchema,
  listMessagesQuerySchema,
  publishProfileKeySchema,
  saveConversationKeysSchema,
  sendMessageSchema,
} from "@/lib/validation/messaging";

const clientId = "00000000-0000-0000-0000-000000000001";
const profileId = "00000000-0000-0000-0000-000000000002";
const iv = "AAAAAAAAAAAAAAAA";
const jwk = { kty: "EC", crv: "P-256", x: "a".repeat(43), y: "b".repeat(43) };

describe("schémas de messagerie", () => {
  it("accepte une enveloppe de message valide", () => {
    const parsed = sendMessageSchema.parse({
      clientId,
      ciphertext: "AAAA",
      iv,
      senderKeyId: "k1",
    });
    expect(parsed.keyVersion).toBe(1);
  });

  it("refuse une enveloppe non base64", () => {
    expect(
      sendMessageSchema.safeParse({
        clientId,
        ciphertext: "not base64!",
        iv,
        senderKeyId: "k1",
      }).success,
    ).toBe(false);
  });

  it("refuse un IV trop court", () => {
    expect(
      sendMessageSchema.safeParse({
        clientId,
        ciphertext: "AAAA",
        iv: "AAAA",
        senderKeyId: "k1",
      }).success,
    ).toBe(false);
  });

  it("refuse un clientId non UUID", () => {
    expect(
      createDirectConversationSchema.safeParse({ participantId: "p2" }).success,
    ).toBe(false);
  });

  it("valide une clé publique P-256", () => {
    expect(publishProfileKeySchema.safeParse({ keyId: "k1", publicKeyJwk: jwk }).success).toBe(true);
  });

  it("refuse une clé publique hors P-256", () => {
    expect(
      publishProfileKeySchema.safeParse({
        keyId: "k1",
        publicKeyJwk: { ...jwk, crv: "P-384" },
      }).success,
    ).toBe(false);
  });

  it("accepte un lot de clés enveloppées", () => {
    expect(
      saveConversationKeysSchema.safeParse({
        keys: [{ profileId, keyId: "k1", wrappedKey: "AAAA", iv }],
      }).success,
    ).toBe(true);
  });

  it("refuse un lot vide", () => {
    expect(saveConversationKeysSchema.safeParse({ keys: [] }).success).toBe(false);
  });

  it("convertit les paramètres de pagination", () => {
    expect(listMessagesQuerySchema.parse({ first: "20" }).first).toBe(20);
    expect(listMessagesQuerySchema.parse({}).first).toBe(50);
  });
});
