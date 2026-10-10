import { sql } from "drizzle-orm";
import {
  check,
  index,
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
    status: projectStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
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
    check(
      "projects_status_published_at_check",
      sql`(${t.status} = 'published' and ${t.publishedAt} is not null) or (${t.status} = 'draft' and ${t.publishedAt} is null)`,
    ),
    check("projects_title_check", sql`char_length(${t.title}) between 3 and 120`),
    check("projects_body_check", sql`char_length(${t.body}) between 1 and 5000`),
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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("posts_author_idx").on(t.authorId, t.createdAt.desc(), t.id.desc()),
    check("posts_body_check", sql`char_length(${t.body}) between 1 and 5000`),
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
