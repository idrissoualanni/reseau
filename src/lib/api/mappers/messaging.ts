import { getPublicUrl } from "@/lib/storage";
import type {
  ContactRequest,
  Conversation,
  ConversationKey,
  ConversationSummary,
  EncryptedMessage,
  MessageReaction,
  ProfileKey,
  ProfileRef,
} from "@/lib/types";

// DTO de la messagerie V2 (F34). `directKey` et les clés privées ne sortent
// jamais ; les enveloppes chiffrées restent opaques pour le client.

function toParticipantDto(profile: ProfileRef, role: "member" | "owner") {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarKey ? getPublicUrl(profile.avatarKey) : null,
    role,
  };
}

export function toMessageDto(message: EncryptedMessage) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    clientId: message.clientId,
    ciphertext: message.ciphertext,
    iv: message.iv,
    keyVersion: message.keyVersion,
    senderKeyId: message.senderKeyId,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    deletedAt: message.deletedAt?.toISOString() ?? null,
  };
}

export function toReactionDto(reaction: MessageReaction) {
  return {
    messageId: reaction.messageId,
    profileId: reaction.profileId,
    ciphertext: reaction.ciphertext,
    iv: reaction.iv,
    keyVersion: reaction.keyVersion,
    createdAt: reaction.createdAt.toISOString(),
    updatedAt: reaction.updatedAt.toISOString(),
  };
}

export function toConversationSummaryDto(summary: ConversationSummary) {
  const { conversation } = summary;
  return {
    id: conversation.id,
    kind: conversation.kind,
    createdBy: conversation.createdBy,
    createdAt: conversation.createdAt.toISOString(),
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    unreadCount: summary.unreadCount,
    participants: summary.participants.map(({ participant, profile }) =>
      toParticipantDto(profile, participant.role),
    ),
    lastMessage: summary.lastMessage ? toMessageDto(summary.lastMessage) : null,
  };
}

export function toConversationDto(conversation: Conversation) {
  return {
    id: conversation.id,
    kind: conversation.kind,
    createdBy: conversation.createdBy,
    createdAt: conversation.createdAt.toISOString(),
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
  };
}

export function toProfileKeyDto(key: ProfileKey) {
  return {
    profileId: key.profileId,
    keyId: key.keyId,
    publicKeyJwk: key.publicKeyJwk,
    algorithm: key.algorithm,
    createdAt: key.createdAt.toISOString(),
  };
}

export function toConversationKeyDto(key: ConversationKey) {
  return {
    conversationId: key.conversationId,
    keyId: key.keyId,
    wrappedKey: key.wrappedKey,
    iv: key.iv,
    algorithm: key.algorithm,
    createdAt: key.createdAt.toISOString(),
  };
}

export type MessageDto = ReturnType<typeof toMessageDto>;
export type ConversationSummaryDto = ReturnType<typeof toConversationSummaryDto>;

// Demande de contact : état seul (réponse de création) puis vue avec le profil
// de l'autre partie (liste des demandes en attente).
export function toContactRequestStateDto(request: ContactRequest) {
  return {
    id: request.id,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    respondedAt: request.respondedAt?.toISOString() ?? null,
  };
}

export function toContactRequestDto(
  row: { request: ContactRequest; requester: ProfileRef; recipient: ProfileRef },
  currentProfileId: string,
) {
  const outgoing = row.request.requesterId === currentProfileId;
  const other = outgoing ? row.recipient : row.requester;
  return {
    ...toContactRequestStateDto(row.request),
    direction: outgoing ? ("outgoing" as const) : ("incoming" as const),
    profile: {
      id: other.id,
      username: other.username,
      displayName: other.displayName,
      avatarUrl: other.avatarKey ? getPublicUrl(other.avatarKey) : null,
    },
  };
}

export type ContactRequestDto = ReturnType<typeof toContactRequestDto>;
