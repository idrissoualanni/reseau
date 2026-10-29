"use client";

// Chiffrement E2E de la messagerie (F34). Le serveur ne reçoit que des
// enveloppes opaques. La clé privée reste dans IndexedDB, non exportable.

const DB_NAME = "reseau-e2e-v1";
const STORE = "identities";
const DB_VERSION = 1;

export type Identity = {
  profileId: string;
  keyId: string;
  publicKeyJwk: JsonWebKey;
  privateKey: CryptoKey;
};

export type ParticipantKey = {
  profileId: string;
  keyId: string;
  publicKeyJwk: JsonWebKey;
};

export type WrappedConversationKey = {
  profileId: string;
  keyId: string;
  wrappedKey: string;
  iv: string;
};

export type ConversationKeyBundle = {
  participantKeys: ParticipantKey[];
  wrappedKeys: Array<WrappedConversationKey & { conversationId: string }>;
};

export type CipherEnvelope = {
  ciphertext: string;
  iv: string;
  keyVersion: number;
};

export type ConversationKeyHint = {
  conversationId: string;
  keyId: string;
  wrappedKey: string;
  iv: string;
  creatorProfileId: string;
  creatorKeyId: string;
  creatorPublicKeyJwk: JsonWebKey;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class E2EKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "E2EKeyError";
  }
}

function bytesToBase64(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array<ArrayBuffer>): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "profileId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB indisponible."));
  });
}

async function readLocalIdentity(profileId: string): Promise<Identity | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(profileId);
    request.onsuccess = () => resolve((request.result as Identity | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Lecture de clé impossible."));
  });
}

async function writeLocalIdentity(identity: Identity): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(identity);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Écriture de clé impossible."));
  });
}

async function hashKeyId(jwk: JsonWebKey): Promise<string> {
  const material = `${jwk.kty}.${jwk.crv}.${jwk.x}.${jwk.y}`;
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(material));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function generateIdentity(profileId: string): Promise<Identity> {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"],
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  // La clé stockée est réimportée non exportable.
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey", "deriveBits"],
  );
  const keyId = await hashKeyId(publicJwk);
  return {
    profileId,
    keyId,
    publicKeyJwk: { kty: publicJwk.kty, crv: publicJwk.crv, x: publicJwk.x, y: publicJwk.y },
    privateKey,
  };
}

export async function getOrCreateLocalIdentity(profileId: string): Promise<Identity> {
  const existing = await readLocalIdentity(profileId);
  if (existing) return existing;
  const identity = await generateIdentity(profileId);
  await writeLocalIdentity(identity);
  return identity;
}

export async function publishIdentity(identity: Identity): Promise<void> {
  const response = await fetch("/api/keys/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyId: identity.keyId, publicKeyJwk: identity.publicKeyJwk }),
  });
  if (!response.ok) {
    throw new E2EKeyError(
      "La clé locale ne correspond pas à la clé publiée. Utilise le même navigateur ou réinitialise la clé côté serveur.",
    );
  }
}

export async function ensurePublishedIdentity(profileId: string): Promise<Identity> {
  const response = await fetch("/api/keys/me", { cache: "no-store" });
  if (!response.ok) throw new E2EKeyError("Impossible de vérifier la clé de chiffrement.");
  const payload = (await response.json()) as { key: { keyId: string } | null };
  const local = await readLocalIdentity(profileId);

  if (payload.key) {
    if (!local || local.keyId !== payload.key.keyId) {
      throw new E2EKeyError(
        "Ta clé privée est enregistrée dans le navigateur où tu as activé la messagerie. Ouvre Réseau depuis ce navigateur pour lire tes messages. La récupération sur un nouvel appareil n'est pas encore disponible.",
      );
    }
    return local;
  }

  const identity = local ?? (await getOrCreateLocalIdentity(profileId));
  await publishIdentity(identity);
  return identity;
}

export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, false, []);
}

async function deriveWrapKey(
  privateKey: CryptoKey,
  publicKeyJwk: JsonWebKey,
  conversationId: string,
  recipientKeyId: string,
): Promise<CryptoKey> {
  const publicKey = await importPublicKey(publicKeyJwk);
  const shared = await crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    256,
  );
  const hkdfKey = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  const salt = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`reseau-e2e-wrap|${conversationId}`),
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info: encoder.encode(`wrap|${recipientKeyId}`),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function wrapAad(conversationId: string, recipientKeyId: string): Uint8Array<ArrayBuffer> {
  return encoder.encode(`wrap|${conversationId}|${recipientKeyId}`);
}

export async function wrapConversationKey(
  rawKey: Uint8Array<ArrayBuffer>,
  privateKey: CryptoKey,
  recipient: ParticipantKey,
  conversationId: string,
): Promise<{ wrappedKey: string; iv: string }> {
  const wrapKey = await deriveWrapKey(
    privateKey,
    recipient.publicKeyJwk,
    conversationId,
    recipient.keyId,
  );
  const iv = randomBytes(12);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: wrapAad(conversationId, recipient.keyId),
    },
    wrapKey,
    rawKey,
  );
  return {
    wrappedKey: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
  };
}

export async function unwrapConversationKey(
  privateKey: CryptoKey,
  creator: ParticipantKey,
  wrapped: WrappedConversationKey,
  conversationId: string,
): Promise<CryptoKey> {
  const wrapKey = await deriveWrapKey(
    privateKey,
    creator.publicKeyJwk,
    conversationId,
    wrapped.keyId,
  );
  const raw = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToBytes(wrapped.iv),
      additionalData: wrapAad(conversationId, wrapped.keyId),
    },
    wrapKey,
    base64ToBytes(wrapped.wrappedKey),
  );
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

const keyCache = new Map<string, CryptoKey>();

export function clearConversationKeyCache(): void {
  keyCache.clear();
}

export async function loadConversationKey(input: {
  conversationId: string;
  createdBy: string;
  profileId: string;
  identity: Identity;
}): Promise<CryptoKey> {
  const cached = keyCache.get(input.conversationId);
  if (cached) return cached;

  const response = await fetch(`/api/conversations/${input.conversationId}/keys`, {
    cache: "no-store",
  });
  if (!response.ok) throw new E2EKeyError("Impossible de charger les clés de la conversation.");
  const bundle = (await response.json()) as ConversationKeyBundle;

  const ownWrapped = bundle.wrappedKeys.find(
    (key) => key.profileId === input.profileId && key.keyId === input.identity.keyId,
  );
  if (ownWrapped) {
    const creator = bundle.participantKeys.find((key) => key.profileId === input.createdBy);
    if (!creator) throw new E2EKeyError("Clé du créateur introuvable.");
    const key = await unwrapConversationKey(
      input.identity.privateKey,
      creator,
      ownWrapped,
      input.conversationId,
    );
    keyCache.set(input.conversationId, key);
    return key;
  }

  if (input.createdBy !== input.profileId) {
    throw new E2EKeyError("En attente de la clé de conversation du créateur.");
  }

  const missing = bundle.participantKeys.find((key) => !key.keyId);
  if (missing) throw new E2EKeyError("Un participant n'a pas publié sa clé.");

  const raw = randomBytes(32);
  const entries = await Promise.all(
    bundle.participantKeys.map(async (participant) => {
      const wrapped = await wrapConversationKey(
        raw,
        input.identity.privateKey,
        participant,
        input.conversationId,
      );
      return {
        profileId: participant.profileId,
        keyId: participant.keyId,
        ...wrapped,
      };
    }),
  );

  const save = await fetch(`/api/conversations/${input.conversationId}/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys: entries }),
  });
  if (!save.ok) throw new E2EKeyError("Impossible d'enregistrer les clés de la conversation.");

  const key = await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
  keyCache.set(input.conversationId, key);
  return key;
}

// Aperçus : charge en une requête les clés des conversations de la liste.
export async function loadPreviewKeys(identity: Identity): Promise<Map<string, CryptoKey>> {
  const keys = new Map<string, CryptoKey>();
  const response = await fetch("/api/conversations/previews", { cache: "no-store" });
  if (!response.ok) return keys;
  const payload = (await response.json()) as { items?: ConversationKeyHint[] };
  const hints = payload.items ?? [];

  await Promise.all(
    hints.map(async (hint) => {
      const cached = keyCache.get(hint.conversationId);
      if (cached) {
        keys.set(hint.conversationId, cached);
        return;
      }
      if (hint.keyId !== identity.keyId) return;
      try {
        const key = await unwrapConversationKey(
          identity.privateKey,
          {
            profileId: hint.creatorProfileId,
            keyId: hint.creatorKeyId,
            publicKeyJwk: hint.creatorPublicKeyJwk,
          },
          {
            profileId: identity.profileId,
            keyId: hint.keyId,
            wrappedKey: hint.wrappedKey,
            iv: hint.iv,
          },
          hint.conversationId,
        );
        keyCache.set(hint.conversationId, key);
        keys.set(hint.conversationId, key);
      } catch {
        // Clé illisible : l'aperçu reste masqué, la conversation reste utilisable.
      }
    }),
  );
  return keys;
}

export async function decryptMessageEnvelope(
  key: CryptoKey,
  conversationId: string,
  message: { id: string; senderId: string; keyVersion: number; ciphertext: string; iv: string },
): Promise<string> {
  return decryptMessage(key, message, messageAad({
    conversationId,
    messageId: message.id,
    senderId: message.senderId,
    keyVersion: message.keyVersion,
  }));
}

export function messageAad(input: {
  conversationId: string;
  messageId: string;
  senderId: string;
  keyVersion: number;
}): Uint8Array<ArrayBuffer> {
  return encoder.encode(
    `message|${input.conversationId}|${input.messageId}|${input.senderId}|${input.keyVersion}`,
  );
}

export function reactionAad(input: {
  messageId: string;
  profileId: string;
  keyVersion: number;
}): Uint8Array<ArrayBuffer> {
  return encoder.encode(`reaction|${input.messageId}|${input.profileId}|${input.keyVersion}`);
}

export async function encryptMessage(
  key: CryptoKey,
  text: string,
  aad: Uint8Array<ArrayBuffer>,
): Promise<Omit<CipherEnvelope, "keyVersion">> {
  const iv = randomBytes(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad },
    key,
    encoder.encode(text),
  );
  return { ciphertext: bytesToBase64(new Uint8Array(ciphertext)), iv: bytesToBase64(iv) };
}

export async function decryptMessage(
  key: CryptoKey,
  envelope: { ciphertext: string; iv: string },
  aad: Uint8Array<ArrayBuffer>,
): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(envelope.iv), additionalData: aad },
    key,
    base64ToBytes(envelope.ciphertext),
  );
  return decoder.decode(plaintext);
}

export async function encryptReaction(
  key: CryptoKey,
  emoji: string,
  aad: Uint8Array<ArrayBuffer>,
): Promise<Omit<CipherEnvelope, "keyVersion">> {
  return encryptMessage(key, emoji, aad);
}

export async function decryptReaction(
  key: CryptoKey,
  envelope: { ciphertext: string; iv: string },
  aad: Uint8Array<ArrayBuffer>,
): Promise<string> {
  return decryptMessage(key, envelope, aad);
}
