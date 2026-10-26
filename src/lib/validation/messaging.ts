import { z } from "zod";

// Schémas de la messagerie V2 (F34). Le serveur ne reçoit que des enveloppes
// opaques : aucune validation ne tente de déchiffrer.

const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Identifiant invalide.",
  );

const base64Schema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9+/]+={0,2}$/, "Encodage base64 invalide.");

const base64UrlSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, "Clé publique invalide.");

const keyIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "Identifiant de clé invalide.");

const ivSchema = base64Schema.refine(
  (value) => value.length >= 16 && value.length <= 24,
  "Vecteur d'initialisation invalide.",
);

export const conversationIdSchema = uuidSchema;
export const messageIdSchema = uuidSchema;

export const createDirectConversationSchema = z
  .object({
    participantId: uuidSchema,
  })
  .strict();

export const sendMessageSchema = z
  .object({
    clientId: uuidSchema,
    ciphertext: base64Schema.max(22000, "Message trop volumineux."),
    iv: ivSchema,
    keyVersion: z.number().int().min(1).max(100).default(1),
    senderKeyId: keyIdSchema,
  })
  .strict();

export const messageReactionSchema = z
  .object({
    ciphertext: base64Schema.max(2000, "Réaction trop volumineuse."),
    iv: ivSchema,
    keyVersion: z.number().int().min(1).max(100).default(1),
  })
  .strict();

export const markConversationReadSchema = z
  .object({
    readAt: z.iso.datetime({ offset: true }).optional(),
  })
  .strict();

export const listMessagesQuerySchema = z.object({
  first: z.coerce.number().int().min(1).max(50).default(50),
  after: z.string().max(200).optional(),
});

export const publishProfileKeySchema = z
  .object({
    keyId: keyIdSchema,
    publicKeyJwk: z
      .object({
        kty: z.literal("EC"),
        crv: z.literal("P-256"),
        x: base64UrlSchema,
        y: base64UrlSchema,
      })
      .passthrough(),
  })
  .strict();

export const conversationKeyEntrySchema = z
  .object({
    profileId: uuidSchema,
    keyId: keyIdSchema,
    wrappedKey: base64Schema.max(2000, "Clé enveloppée trop volumineuse."),
    iv: ivSchema,
  })
  .strict();

export const saveConversationKeysSchema = z
  .object({
    keys: z.array(conversationKeyEntrySchema).min(1).max(50),
  })
  .strict();

export type CreateDirectConversationInput = z.infer<typeof createDirectConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MessageReactionInput = z.infer<typeof messageReactionSchema>;
export type PublishProfileKeyInput = z.infer<typeof publishProfileKeySchema>;
export type ConversationKeysInput = z.infer<typeof conversationKeyEntrySchema>;
