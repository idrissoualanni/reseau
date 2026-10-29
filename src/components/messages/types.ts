export type ParticipantDto = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: "member" | "owner";
};

export type MessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  clientId: string;
  ciphertext: string;
  iv: string;
  keyVersion: number;
  senderKeyId: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  reactions?: ReactionDto[];
};

export type ReactionDto = {
  messageId: string;
  profileId: string;
  ciphertext: string;
  iv: string;
  keyVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type ConversationDto = {
  id: string;
  kind: "direct" | "group";
  createdBy: string;
  createdAt: string;
  lastMessageAt: string | null;
  unreadCount: number;
  participants: ParticipantDto[];
  lastMessage: MessageDto | null;
};

// Demande de contact (aucun texte : le serveur ne voit rien).
export type ContactRequestDto = {
  id: string;
  status: "pending" | "accepted" | "declined";
  direction: "incoming" | "outgoing";
  createdAt: string;
  respondedAt: string | null;
  profile: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

export type ContactRequestsState = {
  incoming: ContactRequestDto[];
  outgoing: ContactRequestDto[];
};

// Ligne Realtime (snake_case) : le SQL scellé renvoie la forme Postgres brute.
export type LiveMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  client_id: string;
  ciphertext: string;
  iv: string;
  key_version: number;
  sender_key_id: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  reactions: LiveReactionRow[];
};

export type LiveReactionRow = {
  profile_id: string;
  ciphertext: string;
  iv: string;
  key_version: number;
  created_at: string;
  updated_at: string;
};

export type UiMessage = {
  id: string;
  senderId: string;
  createdAt: string;
  text: string | null;
  sending?: boolean;
  failed?: boolean;
  reactions: UiReaction[];
};

export type UiReaction = {
  emoji: string;
  profileIds: string[];
};
