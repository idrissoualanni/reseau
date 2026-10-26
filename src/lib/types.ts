// Entités du domaine, indépendantes de Drizzle et de HTTP. Les repositories
// convertissent les lignes de base en ces types ; les composants ne voient
// jamais une ligne brute (règles architecture §7 et api-rest §10).

export type ProofLevel = "declared" | "demonstrated";

// ─── V1.5 — Enums pour validation Zod (utilisés dans validation/project.ts) ──────

export const projectTypeValues = [
  "personal",
  "team",
  "open_source",
  "research",
  "coursework",
] as const;

export const projectReactionTypeValues = [
  "like",
  "celebrate",
  "insight",
  "curious",
] as const;

export type ProjectType = (typeof projectTypeValues)[number];
export type ProjectReactionType = (typeof projectReactionTypeValues)[number];

export type Profile = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  schoolName: string | null;
  fieldOfStudy: string | null;
  avatarKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Skill = {
  id: string;
  slug: string;
  name: string;
};

export type ProfileSkill = Skill & { proofLevel: ProofLevel };

export type ProjectStatus = "draft" | "published";

export type Project = {
  id: string;
  authorId: string;
  title: string;
  body: string;
  coverKey: string | null;
  status: ProjectStatus;
  publishedAt: Date | null;
  type: ProjectType;
  createdAt: Date;
  updatedAt: Date;
};

export type Post = {
  id: string;
  authorId: string;
  body: string;
  imageKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PostComment = {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

// Page par curseur opaque ; `nextCursor` nul signifie « fin de liste ».
export type ProjectPage = {
  items: Project[];
  nextCursor: string | null;
};

// ─── V1.5 — espaces, appartenances, administration (F14/F15/F16/F17) ─────────

export type SpaceType = "university" | "department" | "theme";
export type SpaceVisibility = "public" | "private";
export type SpaceAccessKind = "open" | "invite_code" | "invite_link" | "manual_approval";
export type MembershipRole = "member" | "space_admin";
export type MembershipVerification = "unverified" | "verified";
export type SpaceAccessAction =
  | "join"
  | "request"
  | "approve"
  | "reject"
  | "revoke"
  | "invite";

export type Space = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: SpaceType;
  visibility: SpaceVisibility;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SpaceAccessMethod = {
  id: string;
  spaceId: string;
  method: SpaceAccessKind;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Membership = {
  id: string;
  spaceId: string;
  profileId: string;
  role: MembershipRole;
  verificationLevel: MembershipVerification;
  verifiedVia: SpaceAccessKind | null;
  createdAt: Date;
  updatedAt: Date;
};

// Appartenance jointe à son profil, pour les vues de gestion (F15/F17).
export type SpaceMember = {
  membership: Membership;
  profile: Profile;
};

export type SpaceAccessLogEntry = {
  id: string;
  spaceId: string;
  profileId: string | null;
  method: SpaceAccessKind | null;
  action: SpaceAccessAction;
  createdAt: Date;
};

// Référence publique d'un profil : jamais d'e-mail ni de `user_id`.
export type ProfileRef = {
  id: string;
  username: string;
  displayName: string;
  avatarKey: string | null;
};

// Vues d'administration « tout voir » (F17).
export type AdminProfileRecord = {
  profile: Profile;
  postCount: number;
  projectCount: number;
};

export type AdminPostRecord = {
  post: Post;
  author: ProfileRef;
};

export type AdminProjectRecord = {
  project: Project;
  author: ProfileRef;
};

export type AdminAccessLogRecord = {
  entry: SpaceAccessLogEntry;
  space: { id: string; slug: string; name: string };
  profile: ProfileRef | null;
};

export type AdminStats = {
  spaces: number;
  archivedSpaces: number;
  profiles: number;
  posts: number;
  projects: number;
  accessEvents: number;
};

// Journal des envois OTP (F17) : **aucun code** n'est stocké ni exposé.
export type AdminOtpEventRecord = {
  id: string;
  email: string;
  type: string;
  outcome: string;
  errorCode: string | null;
  createdAt: Date;
};

// ─── V1.5 — Fonctionnalités sociales projets (F19) ──────────────────────────

export type ProjectReaction = {
  projectId: string;
  profileId: string;
  type: ProjectReactionType;
  createdAt: Date;
};

export type ProjectReactionCounts = {
  type: ProjectReactionType;
  count: number;
  hasReacted: boolean;
};

export type ProjectComment = {
  id: string;
  projectId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectCommentWithAuthor = ProjectComment & {
  author: ProfileRef;
  replies: ProjectCommentWithAuthor[];
  depth: number;
};

export type ProjectFollower = {
  projectId: string;
  profileId: string;
  createdAt: Date;
};

// ─── V1.5 — Évolutions de projet / Updates (F20) ────────────────────────────

export type ProjectUpdate = {
  id: string;
  projectId: string;
  authorId: string;
  body: string;
  imageKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectUpdateWithAuthor = ProjectUpdate & {
  author: ProfileRef;
};

// ─── V2 — messagerie chiffrée (F34) ─────────────────────────────────────────

export type ConversationKind = "direct" | "group";
export type ConversationRole = "member" | "owner";

export type Conversation = {
  id: string;
  kind: ConversationKind;
  directKey: string | null;
  createdBy: string;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ConversationParticipant = {
  conversationId: string;
  profileId: string;
  role: ConversationRole;
  lastReadAt: Date;
  joinedAt: Date;
};

// Ligne de message : uniquement des enveloppes opaques côté serveur.
export type EncryptedMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  clientId: string;
  ciphertext: string;
  iv: string;
  keyVersion: number;
  senderKeyId: string;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
};

export type MessageReaction = {
  messageId: string;
  profileId: string;
  ciphertext: string;
  iv: string;
  keyVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ConversationKey = {
  conversationId: string;
  profileId: string;
  keyId: string;
  wrappedKey: string;
  iv: string;
  algorithm: string;
  createdAt: Date;
};

export type ProfileKey = {
  profileId: string;
  keyId: string;
  publicKeyJwk: Record<string, unknown>;
  algorithm: string;
  createdAt: Date;
  rotatedAt: Date | null;
};

export type ConversationSummary = {
  conversation: Conversation;
  participants: Array<{ participant: ConversationParticipant; profile: ProfileRef }>;
  lastMessage: EncryptedMessage | null;
  unreadCount: number;
};
