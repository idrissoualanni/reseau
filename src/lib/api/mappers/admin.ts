import type {
  AdminAccessLogRecord,
  AdminOtpEventRecord,
  AdminPostRecord,
  AdminProfileRecord,
  AdminProjectRecord,
  ProfileRef,
  Space,
  SpaceAccessMethod,
} from "@/lib/types";
import type { SpaceWithMemberCount } from "@/lib/repositories/spaces";
import { getPublicUrl } from "@/lib/storage";
import { toAuthorSummary } from "./profile";

// Mappers de l'administration (F17). `userId` et `avatarKey` ne sortent jamais :
// l'admin voit les contenus, pas les identifiants internes (api-rest §10).

export function toSpaceDto(space: Space, memberCount?: number) {
  return {
    id: space.id,
    slug: space.slug,
    name: space.name,
    description: space.description,
    type: space.type,
    visibility: space.visibility,
    archived: space.archivedAt !== null,
    ...(memberCount === undefined ? {} : { memberCount }),
    createdAt: space.createdAt.toISOString(),
    updatedAt: space.updatedAt.toISOString(),
  };
}

export type SpaceDto = ReturnType<typeof toSpaceDto>;

export function toSpaceWithCountDto(record: SpaceWithMemberCount) {
  return toSpaceDto(record.space, record.memberCount);
}

export function toSpaceAccessMethodDto(method: SpaceAccessMethod) {
  return {
    id: method.id,
    method: method.method,
    isActive: method.isActive,
    createdAt: method.createdAt.toISOString(),
  };
}

export function toAdminProfileDto(record: AdminProfileRecord) {
  return {
    id: record.profile.id,
    username: record.profile.username,
    displayName: record.profile.displayName,
    bio: record.profile.bio,
    schoolName: record.profile.schoolName,
    fieldOfStudy: record.profile.fieldOfStudy,
    avatarUrl: record.profile.avatarKey ? getPublicUrl(record.profile.avatarKey) : null,
    postCount: record.postCount,
    projectCount: record.projectCount,
    createdAt: record.profile.createdAt.toISOString(),
  };
}

export function toAdminPostDto(record: AdminPostRecord) {
  return {
    id: record.post.id,
    body: record.post.body,
    imageUrl: record.post.imageKey ? getPublicUrl(record.post.imageKey) : null,
    author: toAuthorSummary(record.author),
    createdAt: record.post.createdAt.toISOString(),
  };
}

export function toAdminProjectDto(record: AdminProjectRecord) {
  return {
    id: record.project.id,
    title: record.project.title,
    body: record.project.body,
    coverUrl: record.project.coverKey ? getPublicUrl(record.project.coverKey) : null,
    status: record.project.status,
    author: toAuthorSummary(record.author),
    publishedAt: record.project.publishedAt?.toISOString() ?? null,
    createdAt: record.project.createdAt.toISOString(),
  };
}

export function toAccessLogDto(record: AdminAccessLogRecord) {
  return {
    id: record.entry.id,
    space: record.space,
    profile: toAuthorSummary(record.profile),
    method: record.entry.method,
    action: record.entry.action,
    createdAt: record.entry.createdAt.toISOString(),
  };
}

export function toProfileRefDto(ref: ProfileRef) {
  return toAuthorSummary(ref);
}

// Journal des envois OTP : adresse, type, résultat, date. **Jamais de code.**
export function toOtpEventDto(record: AdminOtpEventRecord) {
  return {
    id: record.id,
    email: record.email,
    type: record.type,
    outcome: record.outcome,
    errorCode: record.errorCode,
    createdAt: record.createdAt.toISOString(),
  };
}
