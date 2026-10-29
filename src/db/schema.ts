import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// Modèle V1 — voir docs/data-model.md.
// Conventions : snake_case pluriel, uuid `gen_random_uuid()`, `timestamptz`.
// Les index GIN/trigramme vivent dans une migration SQL personnalisée, pas ici.

// Niveau de preuve d'une compétence portée par un profil.
export const proofLevel = pgEnum("proof_level", ["declared", "demonstrated"]);

// Statut d'un projet : `draft` (privé) ou `published` (visible).
export const projectStatus = pgEnum("project_status", ["draft", "published"]);

// Type de projet (F18 — catalogue) : personal, team, open_source, research, coursework.
export const projectType = pgEnum("project_type_enum", [
  "personal",
  "team",
  "open_source",
  "research",
  "coursework",
]);

// Types de réaction sur un projet (F19 — social).
export const projectReactionType = pgEnum("project_reaction_type_enum", [
  "like",
  "celebrate",
  "insight",
  "curious",
]);

// Profil public rattaché à un compte Neon Auth (`user_id` = id Auth, unique).
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio"),
    schoolName: text("school_name"),
    fieldOfStudy: text("field_of_study"),
    avatarKey: text("avatar_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("profiles_user_id_uq").on(t.userId),
    uniqueIndex("profiles_username_uq").on(t.username),
    // `username` : 3–30 car., minuscules, [a-z0-9_].
    check("profiles_username_check", sql`${t.username} ~ '^[a-z0-9_]{3,30}$'`),
    check("profiles_display_name_check", sql`char_length(${t.displayName}) between 2 and 60`),
    check("profiles_bio_check", sql`${t.bio} is null or char_length(${t.bio}) <= 500`),
  ],
);

// Référentiel normalisé des compétences (dédoublonné par `slug`).
export const skills = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("skills_slug_uq").on(t.slug),
    check("skills_slug_check", sql`${t.slug} ~ '^[a-z0-9+#.-]{1,40}$'`),
    check("skills_name_check", sql`char_length(${t.name}) between 2 and 40`),
  ],
);

// Compétences portées par un profil ; max 30 par profil (règle applicative).
export const userSkills = pgTable(
  "user_skills",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    proofLevel: proofLevel("proof_level").notNull().default("declared"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.profileId, t.skillId] }),
    index("user_skills_skill_idx").on(t.skillId, t.profileId),
  ],
);

// Projets d'un profil ; brouillon privé ou publié (liste paginée par curseur).
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    coverKey: text("cover_key"),
    // Galerie 5 images (V1.5) : images 2 à 5, la couverture reste `cover_key`.
    imageKeys: text("image_keys").array().notNull().default(sql`'{}'::text[]`),
    status: projectStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    // Type de projet (F18) : personal, team, open_source, research, coursework.
    type: projectType("type").notNull().default("personal"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("projects_published_idx").on(t.status, t.publishedAt.desc(), t.id.desc()),
    // Projets publiés d'un auteur, plus récents d'abord (F08).
    index("projects_author_idx")
      .on(t.authorId, t.publishedAt.desc(), t.id.desc())
      .where(sql`${t.status} = 'published'`),
    // Index partiels par type pour performance filtres catalogue (F18).
    index("projects_published_personal_idx")
      .on(t.publishedAt.desc(), t.id.desc())
      .where(sql`${t.status} = 'published' and ${t.type} = 'personal'`),
    index("projects_published_team_idx")
      .on(t.publishedAt.desc(), t.id.desc())
      .where(sql`${t.status} = 'published' and ${t.type} = 'team'`),
    index("projects_published_open_source_idx")
      .on(t.publishedAt.desc(), t.id.desc())
      .where(sql`${t.status} = 'published' and ${t.type} = 'open_source'`),
    index("projects_published_research_idx")
      .on(t.publishedAt.desc(), t.id.desc())
      .where(sql`${t.status} = 'published' and ${t.type} = 'research'`),
    index("projects_published_coursework_idx")
      .on(t.publishedAt.desc(), t.id.desc())
      .where(sql`${t.status} = 'published' and ${t.type} = 'coursework'`),
    check(
      "projects_status_published_at_check",
      sql`(${t.status} = 'published' and ${t.publishedAt} is not null) or (${t.status} = 'draft' and ${t.publishedAt} is null)`,
    ),
    check("projects_title_check", sql`char_length(${t.title}) between 3 and 120`),
    check("projects_body_check", sql`char_length(${t.body}) between 1 and 5000`),
    check("projects_image_keys_check", sql`cardinality(${t.imageKeys}) between 0 and 4`),
  ],
);

// Étiquettes d'un projet ; max 10 par projet (règle applicative).
export const projectSkills = pgTable(
  "project_skills",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.skillId] }),
    index("project_skills_skill_idx").on(t.skillId),
  ],
);

// Posts (activités) publiés par un membre (F11).
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    // Clé de l'image du post (F12) : `posts/{profileId}/{uuid}.{ext}`, NULL si
    // le post n'a pas d'image. Le schéma GraphQL expose `imageUrl`, jamais la clé.
    imageKey: text("image_key"),
    // Galerie 5 images (V1.5) : images 2 à 5, la première image reste `image_key`.
    imageKeys: text("image_keys").array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("posts_author_idx").on(t.authorId, t.createdAt.desc(), t.id.desc()),
    check("posts_body_check", sql`char_length(${t.body}) between 1 and 5000`),
    check("posts_image_keys_check", sql`cardinality(${t.imageKeys}) between 0 and 4`),
  ],
);

// Commentaires et réponses (F11) : `parent_id` NULL = commentaire de post,
// non-NULL = réponse à un commentaire (imbriquée, suppression en cascade).
export const postComments = pgTable(
  "post_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => postComments.id, {
      onDelete: "cascade",
    }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    index("post_comments_post_idx").on(t.postId, t.createdAt.desc(), t.id.desc()),
    index("post_comments_parent_idx").on(t.parentId),
    check("post_comments_body_check", sql`char_length(${t.body}) between 1 and 1000`),
  ],
);

// J'aime d'un post (F11 V1.5) : une seule ligne par membre et par post.
export const postLikes = pgTable(
  "post_likes",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.profileId] }),
    index("post_likes_profile_idx").on(t.profileId, t.createdAt.desc()),
  ],
);

// ─── V1.5 — espaces, appartenances, administration (F14/F15/F16/F17) ─────────

// Nature d'un espace : établissement, filière ou thème.
export const spaceType = pgEnum("space_type", ["university", "department", "theme"]);

// Visibilité d'un espace : public (tout connecté) ou privé (membres/admins).
export const spaceVisibility = pgEnum("space_visibility", ["public", "private"]);

// Méthodes d'accès d'un espace (ADR 0006). `email_domain` arrive en V2 (F29).
export const spaceAccessKind = pgEnum("space_access_kind", [
  "open",
  "invite_code",
  "invite_link",
  "manual_approval",
]);

// Rôle porté par une appartenance.
export const membershipRole = pgEnum("membership_role", ["member", "space_admin"]);

// Niveau de vérification porté par l'appartenance, jamais par le compte.
export const membershipVerification = pgEnum("membership_verification", [
  "unverified",
  "verified",
]);

// Action journalisée sur un espace (qui, quand, quelle méthode).
export const spaceAccessAction = pgEnum("space_access_action", [
  "join",
  "request",
  "approve",
  "reject",
  "revoke",
  "invite",
]);

// Un espace : université, filière ou communauté thématique. `metadata` porte
// toute donnée spécifique à un type (le cœur reste générique).
export const spaces = pgTable(
  "spaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    type: spaceType("type").notNull(),
    visibility: spaceVisibility("visibility").notNull().default("public"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("spaces_slug_uq").on(t.slug),
    index("spaces_visibility_idx").on(t.visibility, t.createdAt.desc(), t.id.desc()),
    check("spaces_slug_check", sql`${t.slug} ~ '^[a-z0-9-]{3,40}$'`),
    check("spaces_name_check", sql`char_length(${t.name}) between 3 and 80`),
    check(
      "spaces_description_check",
      sql`${t.description} is null or char_length(${t.description}) <= 1000`,
    ),
  ],
);

// Méthodes d'accès configurées sur un espace (une ligne par méthode).
export const spaceAccessMethods = pgTable(
  "space_access_methods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    method: spaceAccessKind("method").notNull(),
    config: jsonb("config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("space_access_methods_space_method_uq").on(t.spaceId, t.method),
    index("space_access_methods_space_idx").on(t.spaceId),
  ],
);

// Appartenance d'un profil à un espace : rôle + niveau de vérification.
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: membershipRole("role").notNull().default("member"),
    verificationLevel: membershipVerification("verification_level")
      .notNull()
      .default("unverified"),
    verifiedVia: spaceAccessKind("verified_via"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("memberships_space_profile_uq").on(t.spaceId, t.profileId),
    index("memberships_space_role_idx").on(t.spaceId, t.role),
    index("memberships_profile_idx").on(t.profileId),
  ],
);

// Journal d'accès à un espace (F15/F17) : lecture seule côté admin.
export const spaceAccessLog = pgTable(
  "space_access_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "set null" }),
    method: spaceAccessKind("method"),
    action: spaceAccessAction("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("space_access_log_space_idx").on(t.spaceId, t.createdAt.desc(), t.id.desc()),
    index("space_access_log_created_idx").on(t.createdAt.desc(), t.id.desc()),
  ],
);

// Journal des envois OTP (console admin, option A) : jamais le code.
export const authOtpAudit = pgTable(
  "auth_otp_audit",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    type: text("type").notNull(),
    outcome: text("outcome").notNull(),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("auth_otp_audit_created_idx").on(t.createdAt.desc(), t.id.desc()),
    index("auth_otp_audit_email_idx").on(t.email),
    check("auth_otp_audit_email_check", sql`char_length(${t.email}) between 3 and 254`),
    check(
      "auth_otp_audit_type_check",
      sql`${t.type} in ('email-verification','forgot-password')`,
    ),
    check("auth_otp_audit_outcome_check", sql`${t.outcome} in ('sent','failed')`),
  ],
);

// ─── V1.5 — Fonctionnalités sociales projets (F19) ──────────────────────────

// Réactions sur un projet : like, celebrate, insight, curious (un par type/user/projet).
export const projectReactions = pgTable(
  "project_reactions",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: projectReactionType("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.profileId, t.type] }),
    index("project_reactions_project_idx").on(t.projectId),
    index("project_reactions_profile_idx").on(t.profileId),
  ],
);

// Commentaires et réponses sur un projet (F19) : parent_id NULL = commentaire racine,
// non-NULL = réponse (imbriquée, suppression en cascade).
export const projectComments = pgTable(
  "project_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => projectComments.id, {
      onDelete: "cascade",
    }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("project_comments_project_idx").on(t.projectId, t.createdAt.desc(), t.id.desc()),
    index("project_comments_parent_idx").on(t.parentId),
    check("project_comments_body_check", sql`char_length(${t.body}) between 1 and 1000`),
  ],
);

// Suiveurs d'un projet (F19) : notifications temps réel sur updates/commentaires.
export const projectFollowers = pgTable(
  "project_followers",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.profileId] }),
    index("project_followers_profile_idx").on(t.profileId),
  ],
);

// ─── V1.5 — Évolutions de projet / Updates (F20) ────────────────────────────

// Mises à jour d'avancement d'un projet (créées par l'auteur uniquement).
export const projectUpdates = pgTable(
  "project_updates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    // Clé image optionnelle (bucket `projet`) : projects/{profileId}/updates/{uuid}.{ext}
    imageKey: text("image_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("project_updates_project_idx").on(t.projectId, t.createdAt.desc(), t.id.desc()),
    index("project_updates_author_idx").on(t.authorId),
    check("project_updates_body_check", sql`char_length(${t.body}) between 0 and 5000`),
  ],
);

// ─── V2 — messagerie chiffrée de bout en bout (F34) ──────────────────────────

// Nature de la conversation. `group` est prévu au schéma mais non exposé en V2.
export const conversationKind = pgEnum("conversation_kind", ["direct", "group"]);
export const conversationRole = pgEnum("conversation_role", ["member", "owner"]);

// Une conversation 1-1 est unique par paire de profils (`direct_key` trié).
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: conversationKind("kind").notNull().default("direct"),
    directKey: text("direct_key"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("conversations_direct_key_uq").on(t.directKey),
    index("conversations_last_message_idx").on(t.lastMessageAt.desc(), t.id.desc()),
    check(
      "conversations_direct_key_check",
      sql`(${t.kind} = 'group' and ${t.directKey} is null) or (${t.kind} = 'direct' and ${t.directKey} is not null)`,
    ),
  ],
);

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: conversationRole("role").notNull().default("member"),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }).defaultNow().notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.profileId] }),
    index("conversation_participants_profile_idx").on(t.profileId, t.conversationId),
  ],
);

// Contenu chiffré côté client : le serveur ne stocke jamais le clair.
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").notNull(),
    ciphertext: text("ciphertext").notNull(),
    iv: text("iv").notNull(),
    keyVersion: integer("key_version").notNull().default(1),
    senderKeyId: text("sender_key_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("messages_sender_client_uq").on(t.senderId, t.clientId),
    index("messages_conversation_idx").on(t.conversationId, t.createdAt.desc(), t.id.desc()),
    check("messages_ciphertext_check", sql`char_length(${t.ciphertext}) between 1 and 22000`),
    check("messages_iv_check", sql`char_length(${t.iv}) between 16 and 24`),
    check("messages_key_version_check", sql`${t.keyVersion} > 0`),
  ],
);

export const messageReactions = pgTable(
  "message_reactions",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    ciphertext: text("ciphertext").notNull(),
    iv: text("iv").notNull(),
    keyVersion: integer("key_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.messageId, t.profileId] }),
    index("message_reactions_profile_idx").on(t.profileId),
    check("message_reactions_ciphertext_check", sql`char_length(${t.ciphertext}) between 1 and 2000`),
    check("message_reactions_iv_check", sql`char_length(${t.iv}) between 16 and 24`),
    check("message_reactions_key_version_check", sql`${t.keyVersion} > 0`),
  ],
);

// Accusés de réception / lecture d'un message par participant.
export const messageReceipts = pgTable(
  "message_receipts",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.messageId, t.profileId] }),
    index("message_receipts_profile_idx").on(t.profileId, t.readAt),
  ],
);

// Clé publique E2E du profil. Aucune clé privée ne quitte le client.
export const profileKeys = pgTable(
  "profile_keys",
  {
    profileId: uuid("profile_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    keyId: text("key_id").notNull(),
    publicKeyJwk: jsonb("public_key_jwk").$type<Record<string, unknown>>().notNull(),
    algorithm: text("algorithm").notNull().default("ECDH-P256"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
  },
  (t) => [check("profile_keys_algorithm_check", sql`${t.algorithm} = 'ECDH-P256'`)],
);

// Clé de conversation enveloppée pour un participant (opaque côté serveur).
export const conversationKeys = pgTable(
  "conversation_keys",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    keyId: text("key_id").notNull(),
    wrappedKey: text("wrapped_key").notNull(),
    iv: text("iv").notNull(),
    algorithm: text("algorithm").notNull().default("AES-256-GCM"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.profileId, t.keyId] }),
    check("conversation_keys_wrapped_check", sql`char_length(${t.wrappedKey}) between 1 and 2000`),
    check("conversation_keys_iv_check", sql`char_length(${t.iv}) between 16 and 24`),
    check("conversation_keys_algorithm_check", sql`${t.algorithm} = 'AES-256-GCM'`),
  ],
);

// Demande de contact : aucune conversation n'existe avant acceptation.
export const contactRequestStatus = pgEnum("conversation_request_status", [
  "pending",
  "accepted",
  "declined",
]);

export const contactRequests = pgTable(
  "conversation_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: contactRequestStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("conversation_requests_pending_uq")
      .on(t.requesterId, t.recipientId)
      .where(sql`${t.status} = 'pending'`),
    index("conversation_requests_recipient_idx").on(
      t.recipientId,
      t.status,
      t.createdAt.desc(),
    ),
    index("conversation_requests_requester_idx").on(
      t.requesterId,
      t.status,
      t.createdAt.desc(),
    ),
    check("conversation_requests_distinct_check", sql`${t.requesterId} <> ${t.recipientId}`),
  ],
);
