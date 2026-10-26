import {
  and,
  count,
  desc,
  eq,
  gt,
  inArray,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db/client";
import {
  conversationKeys,
  conversationParticipants,
  conversations,
  messageReactions,
  messageReceipts,
  messages,
  profileKeys,
  profiles,
} from "@/db/schema";
import type {
  Conversation,
  ConversationKey,
  ConversationParticipant,
  ConversationSummary,
  EncryptedMessage,
  MessageReaction,
  ProfileKey,
  ProfileRef,
} from "@/lib/types";
import { isUniqueViolation } from "@/lib/repositories/shared";

type ConversationRow = typeof conversations.$inferSelect;
type ParticipantRow = typeof conversationParticipants.$inferSelect;
type MessageRow = typeof messages.$inferSelect;
type ReactionRow = typeof messageReactions.$inferSelect;
type ProfileKeyRow = typeof profileKeys.$inferSelect;
type ConversationKeyRow = typeof conversationKeys.$inferSelect;

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    kind: row.kind,
    directKey: row.directKey,
    createdBy: row.createdBy,
    lastMessageAt: row.lastMessageAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toParticipant(row: ParticipantRow): ConversationParticipant {
  return {
    conversationId: row.conversationId,
    profileId: row.profileId,
    role: row.role,
    lastReadAt: row.lastReadAt,
    joinedAt: row.joinedAt,
  };
}

function toMessage(row: MessageRow): EncryptedMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    clientId: row.clientId,
    ciphertext: row.ciphertext,
    iv: row.iv,
    keyVersion: row.keyVersion,
    senderKeyId: row.senderKeyId,
    createdAt: row.createdAt,
    editedAt: row.editedAt,
    deletedAt: row.deletedAt,
  };
}

function toReaction(row: ReactionRow): MessageReaction {
  return {
    messageId: row.messageId,
    profileId: row.profileId,
    ciphertext: row.ciphertext,
    iv: row.iv,
    keyVersion: row.keyVersion,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toProfileKey(row: ProfileKeyRow): ProfileKey {
  return {
    profileId: row.profileId,
    keyId: row.keyId,
    publicKeyJwk: row.publicKeyJwk,
    algorithm: row.algorithm,
    createdAt: row.createdAt,
    rotatedAt: row.rotatedAt,
  };
}

function toConversationKey(row: ConversationKeyRow): ConversationKey {
  return {
    conversationId: row.conversationId,
    profileId: row.profileId,
    keyId: row.keyId,
    wrappedKey: row.wrappedKey,
    iv: row.iv,
    algorithm: row.algorithm,
    createdAt: row.createdAt,
  };
}

function toProfileRef(row: {
  id: string;
  username: string;
  displayName: string;
  avatarKey: string | null;
}): ProfileRef {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatarKey: row.avatarKey,
  };
}

export async function findConversationById(id: string): Promise<Conversation | null> {
  const [row] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return row ? toConversation(row) : null;
}

export async function findConversationByDirectKey(directKey: string): Promise<Conversation | null> {
  const [row] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.directKey, directKey))
    .limit(1);
  return row ? toConversation(row) : null;
}

export async function insertDirectConversation(
  createdBy: string,
  participantIds: string[],
  directKey: string,
): Promise<Conversation> {
  return db.transaction(async (tx) => {
    const [conversation] = await tx
      .insert(conversations)
      .values({ kind: "direct", directKey, createdBy })
      .returning();
    if (!conversation) throw new Error("Conversation non créée.");

    await tx.insert(conversationParticipants).values(
      participantIds.map((profileId) => ({
        conversationId: conversation.id,
        profileId,
        role: profileId === createdBy ? ("owner" as const) : ("member" as const),
      })),
    );

    return toConversation(conversation);
  });
}

export async function findParticipant(
  conversationId: string,
  profileId: string,
): Promise<ConversationParticipant | null> {
  const [row] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.profileId, profileId),
      ),
    )
    .limit(1);
  return row ? toParticipant(row) : null;
}

export async function listParticipants(
  conversationId: string,
): Promise<Array<{ participant: ConversationParticipant; profile: ProfileRef }>> {
  const rows = await db
    .select({ participant: conversationParticipants, profile: profiles })
    .from(conversationParticipants)
    .innerJoin(profiles, eq(profiles.id, conversationParticipants.profileId))
    .where(eq(conversationParticipants.conversationId, conversationId));
  return rows.map((row) => ({
    participant: toParticipant(row.participant),
    profile: toProfileRef(row.profile),
  }));
}

async function listLastMessages(conversationIds: string[]): Promise<Map<string, EncryptedMessage>> {
  const entries = await Promise.all(
    conversationIds.map(async (conversationId) => {
      const [row] = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt), desc(messages.id))
        .limit(1);
      return [conversationId, row ? toMessage(row) : null] as const;
    }),
  );
  return new Map(entries.filter((entry): entry is [string, EncryptedMessage] => entry[1] !== null));
}

export async function listConversationsForProfile(
  profileId: string,
  limit = 50,
): Promise<ConversationSummary[]> {
  const rows = await db
    .select({ conversation: conversations })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      eq(conversationParticipants.conversationId, conversations.id),
    )
    .where(eq(conversationParticipants.profileId, profileId))
    .orderBy(
      desc(sql`coalesce(${conversations.lastMessageAt}, ${conversations.createdAt})`),
      desc(conversations.id),
    )
    .limit(limit);

  if (rows.length === 0) return [];

  const conversationIds = rows.map((row) => row.conversation.id);
  const [participantRows, lastMessages, unreadRows] = await Promise.all([
    db
      .select({ participant: conversationParticipants, profile: profiles })
      .from(conversationParticipants)
      .innerJoin(profiles, eq(profiles.id, conversationParticipants.profileId))
      .where(inArray(conversationParticipants.conversationId, conversationIds)),
    listLastMessages(conversationIds),
    db
      .select({ conversationId: messages.conversationId, unread: count() })
      .from(messages)
      .innerJoin(
        conversationParticipants,
        and(
          eq(conversationParticipants.conversationId, messages.conversationId),
          eq(conversationParticipants.profileId, profileId),
        ),
      )
      .where(
        and(
          inArray(messages.conversationId, conversationIds),
          ne(messages.senderId, profileId),
          gt(messages.createdAt, conversationParticipants.lastReadAt),
        ),
      )
      .groupBy(messages.conversationId),
  ]);

  const unreadByConversation = new Map(
    unreadRows.map((row) => [row.conversationId, Number(row.unread)]),
  );

  const participantsByConversation = new Map<
    string,
    Array<{ participant: ConversationParticipant; profile: ProfileRef }>
  >();
  for (const row of participantRows) {
    const list = participantsByConversation.get(row.participant.conversationId) ?? [];
    list.push({ participant: toParticipant(row.participant), profile: toProfileRef(row.profile) });
    participantsByConversation.set(row.participant.conversationId, list);
  }

  return rows.map((row) => ({
    conversation: toConversation(row.conversation),
    participants: participantsByConversation.get(row.conversation.id) ?? [],
    lastMessage: lastMessages.get(row.conversation.id) ?? null,
    unreadCount: unreadByConversation.get(row.conversation.id) ?? 0,
  }));
}

export type MessagesCursor = { createdAt: Date; id: string };

export async function listMessages(
  conversationId: string,
  limit: number,
  cursor?: MessagesCursor,
): Promise<EncryptedMessage[]> {
  const conditions = [eq(messages.conversationId, conversationId)];
  if (cursor) {
    conditions.push(
      or(
        lt(messages.createdAt, cursor.createdAt),
        and(eq(messages.createdAt, cursor.createdAt), lt(messages.id, cursor.id))!,
      )!,
    );
  }
  const rows = await db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(limit + 1);
  return rows.map(toMessage);
}

export async function findMessageById(id: string): Promise<EncryptedMessage | null> {
  const [row] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return row ? toMessage(row) : null;
}

export async function findMessageByClientId(
  senderId: string,
  clientId: string,
): Promise<EncryptedMessage | null> {
  const [row] = await db
    .select()
    .from(messages)
    .where(and(eq(messages.senderId, senderId), eq(messages.clientId, clientId)))
    .limit(1);
  return row ? toMessage(row) : null;
}

export type NewMessage = {
  conversationId: string;
  senderId: string;
  clientId: string;
  ciphertext: string;
  iv: string;
  keyVersion: number;
  senderKeyId: string;
};

export async function insertMessage(input: NewMessage): Promise<EncryptedMessage> {
  try {
    return await db.transaction(async (tx) => {
      const [row] = await tx.insert(messages).values(input).returning();
      if (!row) throw new Error("Message non créé.");
      await tx
        .update(conversations)
        .set({ lastMessageAt: row.createdAt })
        .where(eq(conversations.id, input.conversationId));
      return toMessage(row);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existing = await findMessageByClientId(input.senderId, input.clientId);
      if (existing) return existing;
    }
    throw error;
  }
}

export async function updateParticipantReadAt(
  conversationId: string,
  profileId: string,
  readAt: Date,
): Promise<boolean> {
  const rows = await db
    .update(conversationParticipants)
    .set({ lastReadAt: readAt })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.profileId, profileId),
      ),
    )
    .returning({ conversationId: conversationParticipants.conversationId });
  return rows.length > 0;
}

export async function upsertMessageReaction(input: {
  messageId: string;
  profileId: string;
  ciphertext: string;
  iv: string;
  keyVersion: number;
}): Promise<MessageReaction> {
  const [row] = await db
    .insert(messageReactions)
    .values(input)
    .onConflictDoUpdate({
      target: [messageReactions.messageId, messageReactions.profileId],
      set: {
        ciphertext: input.ciphertext,
        iv: input.iv,
        keyVersion: input.keyVersion,
        updatedAt: new Date(),
      },
    })
    .returning();
  if (!row) throw new Error("Réaction non enregistrée.");
  return toReaction(row);
}

export async function deleteMessageReaction(
  messageId: string,
  profileId: string,
): Promise<boolean> {
  const rows = await db
    .delete(messageReactions)
    .where(
      and(eq(messageReactions.messageId, messageId), eq(messageReactions.profileId, profileId)),
    )
    .returning({ messageId: messageReactions.messageId });
  return rows.length > 0;
}

export async function listReactionsForMessages(
  messageIds: string[],
): Promise<MessageReaction[]> {
  if (messageIds.length === 0) return [];
  const rows = await db
    .select()
    .from(messageReactions)
    .where(inArray(messageReactions.messageId, messageIds));
  return rows.map(toReaction);
}

export async function markMessageDelivered(
  messageId: string,
  profileId: string,
): Promise<void> {
  await db
    .insert(messageReceipts)
    .values({ messageId, profileId, deliveredAt: new Date() })
    .onConflictDoNothing({ target: [messageReceipts.messageId, messageReceipts.profileId] });
}

export async function upsertProfileKey(input: {
  profileId: string;
  keyId: string;
  publicKeyJwk: Record<string, unknown>;
}): Promise<ProfileKey> {
  const [row] = await db
    .insert(profileKeys)
    .values(input)
    .onConflictDoUpdate({
      target: profileKeys.profileId,
      set: {
        keyId: input.keyId,
        publicKeyJwk: input.publicKeyJwk,
        rotatedAt: new Date(),
      },
    })
    .returning();
  if (!row) throw new Error("Clé publique non enregistrée.");
  return toProfileKey(row);
}

export async function findProfileKey(profileId: string): Promise<ProfileKey | null> {
  const [row] = await db
    .select()
    .from(profileKeys)
    .where(eq(profileKeys.profileId, profileId))
    .limit(1);
  return row ? toProfileKey(row) : null;
}

export async function listProfileKeys(
  profileIds: string[],
): Promise<ProfileKey[]> {
  if (profileIds.length === 0) return [];
  const rows = await db
    .select()
    .from(profileKeys)
    .where(inArray(profileKeys.profileId, profileIds));
  return rows.map(toProfileKey);
}

export async function upsertConversationKeys(
  rows: Array<{
    conversationId: string;
    profileId: string;
    keyId: string;
    wrappedKey: string;
    iv: string;
  }>,
): Promise<ConversationKey[]> {
  if (rows.length === 0) return [];
  const inserted = await db
    .insert(conversationKeys)
    .values(rows)
    .onConflictDoUpdate({
      target: [
        conversationKeys.conversationId,
        conversationKeys.profileId,
        conversationKeys.keyId,
      ],
      set: {
        wrappedKey: sql`excluded.wrapped_key`,
        iv: sql`excluded.iv`,
      },
    })
    .returning();
  return inserted.map(toConversationKey);
}

export async function listConversationKeysForProfile(
  conversationId: string,
  profileId: string,
): Promise<ConversationKey[]> {
  const rows = await db
    .select()
    .from(conversationKeys)
    .where(
      and(
        eq(conversationKeys.conversationId, conversationId),
        eq(conversationKeys.profileId, profileId),
      ),
    )
    .orderBy(desc(conversationKeys.createdAt));
  return rows.map(toConversationKey);
}
