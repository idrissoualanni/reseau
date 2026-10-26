import { ConflictError, ForbiddenError, NotFoundError, RuleViolationError } from "@/lib/errors";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import type { UseCaseContext } from "@/lib/context";
import {
  deleteMessageReaction,
  findConversationByDirectKey,
  findConversationById,
  findConversationSummary,
  findMessageById,
  findMessageByClientId,
  findParticipant,
  findProfileKey,
  insertDirectConversation,
  insertMessage,
  listConversationKeysForProfile,
  listConversationsForProfile,
  listMessages,
  listParticipants,
  listProfileKeys,
  listReactionsForMessages,
  markMessageDelivered,
  updateParticipantReadAt,
  upsertConversationKeys,
  upsertMessageReaction,
  upsertProfileKey,
  type MessagesCursor,
} from "@/lib/repositories/messaging";
import { findProfileById } from "@/lib/repositories/profiles";
import type {
  Conversation,
  ConversationKey,
  ConversationSummary,
  EncryptedMessage,
  MessageReaction,
  ProfileKey,
} from "@/lib/types";
import type {
  ConversationKeysInput,
  MessageReactionInput,
  PublishProfileKeyInput,
  SendMessageInput,
} from "@/lib/validation/messaging";

export const MAX_CONVERSATIONS = 50;
export const MAX_MESSAGES_PAGE = 50;

export function directKeyFor(firstProfileId: string, secondProfileId: string): string {
  return [firstProfileId, secondProfileId].sort().join(":");
}

async function requireConversationMember(
  ctx: UseCaseContext,
  conversationId: string,
): Promise<Conversation> {
  const conversation = await findConversationById(conversationId);
  if (!conversation) throw new NotFoundError("Conversation introuvable.");
  const participant = await findParticipant(conversationId, ctx.profileId);
  if (!participant) throw new NotFoundError("Conversation introuvable.");
  return conversation;
}

export async function startDirectConversation(
  ctx: UseCaseContext,
  participantId: string,
): Promise<{ summary: ConversationSummary; wasCreated: boolean }> {
  if (participantId === ctx.profileId) {
    throw new RuleViolationError("Impossible de démarrer une conversation avec soi-même.");
  }
  const participant = await findProfileById(participantId);
  if (!participant) throw new NotFoundError("Profil introuvable.");

  const directKey = directKeyFor(ctx.profileId, participantId);
  let conversation = await findConversationByDirectKey(directKey);
  let wasCreated = false;
  if (!conversation) {
    try {
      conversation = await insertDirectConversation(ctx.profileId, [ctx.profileId, participantId], directKey);
      wasCreated = true;
    } catch (error) {
      // Course sur la contrainte unique : relire la conversation gagnante.
      conversation = await findConversationByDirectKey(directKey);
      if (!conversation) throw error;
    }
  }

  const summary = await findConversationSummary(conversation.id, ctx.profileId);
  if (!summary) throw new NotFoundError("Conversation introuvable.");
  return { summary, wasCreated };
}

export async function listMyConversations(ctx: UseCaseContext): Promise<ConversationSummary[]> {
  return listConversationsForProfile(ctx.profileId, MAX_CONVERSATIONS);
}

export async function listConversationMessages(
  ctx: UseCaseContext,
  conversationId: string,
  first: number,
  after?: string,
): Promise<{ items: Array<{
  message: EncryptedMessage;
  reactions: MessageReaction[];
}>; nextCursor: string | null }> {
  await requireConversationMember(ctx, conversationId);

  const limit = Math.min(Math.max(first, 1), MAX_MESSAGES_PAGE);
  let cursor: MessagesCursor | undefined;
  if (after) {
    const decoded = decodeCursor(after);
    cursor = { createdAt: decoded.sortAt, id: decoded.id };
  }

  const rows = await listMessages(conversationId, limit, cursor);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const reactions = await listReactionsForMessages(items.map((message) => message.id));
  const reactionsByMessage = new Map<string, MessageReaction[]>();
  for (const reaction of reactions) {
    const list = reactionsByMessage.get(reaction.messageId) ?? [];
    list.push(reaction);
    reactionsByMessage.set(reaction.messageId, list);
  }

  const last = items.at(-1);
  return {
    items: items.map((message) => ({
      message,
      reactions: reactionsByMessage.get(message.id) ?? [],
    })),
    nextCursor: hasMore && last ? encodeCursor({ sortAt: last.createdAt, id: last.id }) : null,
  };
}

export async function sendMessage(
  ctx: UseCaseContext,
  conversationId: string,
  input: SendMessageInput,
): Promise<EncryptedMessage> {
  await requireConversationMember(ctx, conversationId);

  const existing = await findMessageByClientId(ctx.profileId, input.clientId);
  if (existing) {
    if (existing.conversationId !== conversationId) {
      throw new ConflictError("Identifiant de message déjà utilisé.");
    }
    return existing;
  }

  const senderKey = await findProfileKey(ctx.profileId);
  if (!senderKey) {
    throw new RuleViolationError("Configure ta clé de chiffrement avant d'envoyer un message.");
  }
  if (senderKey.keyId !== input.senderKeyId) {
    throw new RuleViolationError("La clé du message ne correspond pas à ta clé publiée.");
  }

  const participants = await listParticipants(conversationId);
  const keyLists = await Promise.all(
    participants.map((participant) =>
      listConversationKeysForProfile(conversationId, participant.profile.id),
    ),
  );
  if (keyLists.some((keys) => keys.length === 0)) {
    throw new RuleViolationError("Les clés de la conversation ne sont pas encore configurées.");
  }

  const message = await insertMessage({
    conversationId,
    senderId: ctx.profileId,
    clientId: input.clientId,
    ciphertext: input.ciphertext,
    iv: input.iv,
    keyVersion: input.keyVersion,
    senderKeyId: input.senderKeyId,
  });

  await Promise.all(
    participants
      .filter((participant) => participant.profile.id !== ctx.profileId)
      .map((participant) => markMessageDelivered(message.id, participant.profile.id)),
  );

  return message;
}

export async function markConversationRead(
  ctx: UseCaseContext,
  conversationId: string,
): Promise<{ conversationId: string; readAt: string }> {
  await requireConversationMember(ctx, conversationId);
  const readAt = new Date();
  const updated = await updateParticipantReadAt(conversationId, ctx.profileId, readAt);
  if (!updated) throw new NotFoundError("Conversation introuvable.");
  return { conversationId, readAt: readAt.toISOString() };
}

async function requireMessageMember(
  ctx: UseCaseContext,
  messageId: string,
): Promise<EncryptedMessage> {
  const message = await findMessageById(messageId);
  if (!message) throw new NotFoundError("Message introuvable.");
  await requireConversationMember(ctx, message.conversationId);
  return message;
}

export async function reactToMessage(
  ctx: UseCaseContext,
  messageId: string,
  input: MessageReactionInput,
): Promise<MessageReaction> {
  await requireMessageMember(ctx, messageId);
  return upsertMessageReaction({
    messageId,
    profileId: ctx.profileId,
    ciphertext: input.ciphertext,
    iv: input.iv,
    keyVersion: input.keyVersion,
  });
}

export async function removeMessageReaction(
  ctx: UseCaseContext,
  messageId: string,
): Promise<void> {
  await requireMessageMember(ctx, messageId);
  await deleteMessageReaction(messageId, ctx.profileId);
}

export async function publishOwnKey(
  ctx: UseCaseContext,
  input: PublishProfileKeyInput,
): Promise<ProfileKey> {
  const existing = await findProfileKey(ctx.profileId);
  if (existing) {
    const sameKey =
      existing.keyId === input.keyId &&
      existing.publicKeyJwk.kty === input.publicKeyJwk.kty &&
      existing.publicKeyJwk.crv === input.publicKeyJwk.crv &&
      existing.publicKeyJwk.x === input.publicKeyJwk.x &&
      existing.publicKeyJwk.y === input.publicKeyJwk.y;
    if (!sameKey) {
      throw new ConflictError(
        "Une clé est déjà configurée ; la réinitialisation n'est pas disponible en V2.",
      );
    }
    return existing;
  }
  return upsertProfileKey({
    profileId: ctx.profileId,
    keyId: input.keyId,
    publicKeyJwk: input.publicKeyJwk,
  });
}

export async function getOwnKey(ctx: UseCaseContext): Promise<ProfileKey | null> {
  return findProfileKey(ctx.profileId);
}

export type ConversationKeyBundle = {
  participantKeys: Array<{ profileId: string; keyId: string; publicKeyJwk: Record<string, unknown> }>;
  wrappedKeys: ConversationKey[];
};

export async function getConversationKeyBundle(
  ctx: UseCaseContext,
  conversationId: string,
): Promise<ConversationKeyBundle> {
  await requireConversationMember(ctx, conversationId);
  const participants = await listParticipants(conversationId);
  const [publicKeys, wrappedKeys] = await Promise.all([
    listProfileKeys(participants.map((participant) => participant.profile.id)),
    listConversationKeysForProfile(conversationId, ctx.profileId),
  ]);
  return {
    participantKeys: publicKeys.map((key) => ({
      profileId: key.profileId,
      keyId: key.keyId,
      publicKeyJwk: key.publicKeyJwk,
    })),
    wrappedKeys,
  };
}

export async function saveConversationKeys(
  ctx: UseCaseContext,
  conversationId: string,
  keys: ConversationKeysInput[],
): Promise<ConversationKey[]> {
  const conversation = await requireConversationMember(ctx, conversationId);
  if (conversation.createdBy !== ctx.profileId) {
    throw new ForbiddenError("Seul le créateur peut configurer les clés de la conversation.");
  }

  const participants = await listParticipants(conversationId);
  const participantIds = new Set(participants.map((participant) => participant.profile.id));
  const publicKeys = await listProfileKeys([...participantIds]);
  const publicKeyById = new Map(publicKeys.map((key) => [key.profileId, key]));

  const providedIds = new Set<string>();
  for (const key of keys) {
    if (providedIds.has(key.profileId)) {
      throw new RuleViolationError("Un participant ne peut avoir qu'une clé par lot.");
    }
    providedIds.add(key.profileId);
    if (!participantIds.has(key.profileId)) {
      throw new ForbiddenError("Ce profil ne participe pas à la conversation.");
    }
    const publicKey = publicKeyById.get(key.profileId);
    if (!publicKey) {
      throw new RuleViolationError("Un participant n'a pas encore publié de clé publique.");
    }
    if (publicKey.keyId !== key.keyId) {
      throw new RuleViolationError("La clé enveloppée ne correspond pas à la clé publique.");
    }
  }

  for (const participantId of participantIds) {
    if (!providedIds.has(participantId)) {
      throw new RuleViolationError("Toutes les clés des participants doivent être fournies.");
    }
  }

  return upsertConversationKeys(
    keys.map((key) => ({
      conversationId,
      profileId: key.profileId,
      keyId: key.keyId,
      wrappedKey: key.wrappedKey,
      iv: key.iv,
    })),
  );
}
