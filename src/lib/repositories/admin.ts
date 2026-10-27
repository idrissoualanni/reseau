import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  posts,
  profiles,
  projects,
  spaceAccessLog,
  spaces,
} from "@/db/schema";
import type {
  AdminAccessLogRecord,
  AdminPostRecord,
  AdminProfileRecord,
  AdminProjectRecord,
  AdminStats,
  Post,
  Profile,
  ProfileRef,
  Project,
  SpaceAccessAction,
  SpaceAccessKind,
} from "@/lib/types";

// Vues d'administration « tout voir » (F17). L'admin plateforme voit tous les
// contenus, brouillons compris : aucune clause de visibilité ici.
// Listes bornées (console) : `ADMIN_LIST_LIMIT` par défaut.

const ADMIN_LIST_LIMIT = 200;

function toProfile(row: typeof profiles.$inferSelect): Profile {
  return {
    id: row.id,
    userId: row.userId,
    username: row.username,
    displayName: row.displayName,
    bio: row.bio,
    schoolName: row.schoolName,
    fieldOfStudy: row.fieldOfStudy,
    avatarKey: row.avatarKey,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPost(row: typeof posts.$inferSelect): Post {
  return {
    id: row.id,
    authorId: row.authorId,
    body: row.body,
    imageKey: row.imageKey,
    imageKeys: row.imageKeys,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toProject(row: typeof projects.$inferSelect): Project {
  return {
    id: row.id,
    authorId: row.authorId,
    title: row.title,
    body: row.body,
    coverKey: row.coverKey,
    imageKeys: row.imageKeys,
    status: row.status,
    publishedAt: row.publishedAt,
    type: row.type,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listAdminProfiles(limit = ADMIN_LIST_LIMIT): Promise<AdminProfileRecord[]> {
  const rows = await db
    .select({
      profile: profiles,
      postCount: sql<number>`count(distinct ${posts.id})::int`,
      projectCount: sql<number>`count(distinct ${projects.id})::int`,
    })
    .from(profiles)
    .leftJoin(posts, eq(posts.authorId, profiles.id))
    .leftJoin(projects, eq(projects.authorId, profiles.id))
    .groupBy(profiles.id)
    .orderBy(desc(profiles.createdAt), desc(profiles.id))
    .limit(limit);
  return rows.map((row) => ({
    profile: toProfile(row.profile),
    postCount: row.postCount,
    projectCount: row.projectCount,
  }));
}

export async function listAdminPosts(limit = ADMIN_LIST_LIMIT): Promise<AdminPostRecord[]> {
  const rows = await db
    .select({
      post: posts,
      authorId: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarKey: profiles.avatarKey,
    })
    .from(posts)
    .innerJoin(profiles, eq(posts.authorId, profiles.id))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit);
  return rows.map((row) => ({
    post: toPost(row.post),
    author: {
      id: row.authorId,
      username: row.username,
      displayName: row.displayName,
      avatarKey: row.avatarKey,
    },
  }));
}

export async function listAdminProjects(limit = ADMIN_LIST_LIMIT): Promise<AdminProjectRecord[]> {
  const rows = await db
    .select({
      project: projects,
      authorId: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarKey: profiles.avatarKey,
    })
    .from(projects)
    .innerJoin(profiles, eq(projects.authorId, profiles.id))
    .orderBy(desc(projects.createdAt), desc(projects.id))
    .limit(limit);
  return rows.map((row) => ({
    project: toProject(row.project),
    author: {
      id: row.authorId,
      username: row.username,
      displayName: row.displayName,
      avatarKey: row.avatarKey,
    },
  }));
}

export async function listAdminAccessLog(
  spaceId?: string,
  limit = ADMIN_LIST_LIMIT,
): Promise<AdminAccessLogRecord[]> {
  const base = db
    .select({
      entry: spaceAccessLog,
      spaceId: spaces.id,
      spaceSlug: spaces.slug,
      spaceName: spaces.name,
      profileId: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarKey: profiles.avatarKey,
    })
    .from(spaceAccessLog)
    .innerJoin(spaces, eq(spaceAccessLog.spaceId, spaces.id))
    .leftJoin(profiles, eq(spaceAccessLog.profileId, profiles.id));

  const rows = await (spaceId ? base.where(eq(spaceAccessLog.spaceId, spaceId)) : base)
    .orderBy(desc(spaceAccessLog.createdAt), desc(spaceAccessLog.id))
    .limit(limit);

  return rows.map((row) => ({
    entry: {
      id: row.entry.id,
      spaceId: row.entry.spaceId,
      profileId: row.entry.profileId,
      method: row.entry.method as SpaceAccessKind | null,
      action: row.entry.action as SpaceAccessAction,
      createdAt: row.entry.createdAt,
    },
    space: { id: row.spaceId, slug: row.spaceSlug, name: row.spaceName },
    profile: toRef(row.profileId, row.username, row.displayName, row.avatarKey),
  }));
}

function toRef(
  id: string | null,
  username: string | null,
  displayName: string | null,
  avatarKey: string | null,
): ProfileRef | null {
  if (!id || !username || !displayName) return null;
  return { id, username, displayName, avatarKey };
}

export async function adminStats(): Promise<AdminStats> {
  const [spaceRows] = await db
    .select({
      total: sql<number>`count(*)::int`,
      archived: sql<number>`(count(*) filter (where ${spaces.archivedAt} is not null))::int`,
    })
    .from(spaces);
  const [profileRows] = await db.select({ value: sql<number>`count(*)::int` }).from(profiles);
  const [postRows] = await db.select({ value: sql<number>`count(*)::int` }).from(posts);
  const [projectRows] = await db.select({ value: sql<number>`count(*)::int` }).from(projects);
  const [accessRows] = await db.select({ value: sql<number>`count(*)::int` }).from(spaceAccessLog);

  return {
    spaces: spaceRows?.total ?? 0,
    archivedSpaces: spaceRows?.archived ?? 0,
    profiles: profileRows?.value ?? 0,
    posts: postRows?.value ?? 0,
    projects: projectRows?.value ?? 0,
    accessEvents: accessRows?.value ?? 0,
  };
}
