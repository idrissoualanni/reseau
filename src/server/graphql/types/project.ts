import { builder } from "@/server/graphql/builder";
import type { Project } from "@/lib/types";
import type { ProjectConnectionPage, ProjectEdge } from "@/lib/projects";
import {
  createProject,
  deleteProject,
  getVisibleProject,
  listMyProjects,
  listProjects,
  listProjectsV15,
  publishProject,
  unpublishProject,
  updateProject,
  // V1.5 use cases
  addProjectReaction,
  createProjectComment,
  createProjectUpdate,
  deleteProjectComment,
  deleteProjectUpdate,
  followProject,
  removeProjectReaction,
  unfollowProject,
  type ProjectReactionCounts,
  type ProjectCommentWithAuthor,
  type ProjectFollowerWithProfile,
  type ProjectUpdateWithAuthor,
} from "@/lib/projects";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  projectIdSchema,
  publishProjectSchema,
  updateProjectSchema,
  // V1.5 validation
  addProjectReactionSchema,
  createProjectCommentSchema,
  createProjectUpdateSchema,
  deleteProjectUpdateSchema,
  followProjectSchema,
  listProjectsQuerySchema as listProjectsV15QuerySchema,
} from "@/lib/validation/project";
import { getPublicUrl } from "@/lib/storage";
import { requireProfile, run, validateInput } from "@/server/graphql/errors";
import { PageInfoRef } from "./connection";
import { ProfileSummaryRef } from "./profile";
import { SkillRef } from "./skill";
import { projectTypeValues, projectReactionTypeValues } from "@/lib/types";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import {
  countProjectFollowersByProjectId,
  countProjectReactionsByProjectId,
  countProjectUpdatesByProjectId,
  findProjectReactionsByProjectId,
  findUserProjectReactions,
  isProjectFollowedByProfile,
  listProjectCommentsByProjectId,
  listProjectCommentRepliesByParentId,
  listProjectUpdatesByProjectId,
} from "@/lib/repositories/projects";

// Type Project et opérations (F05/F06/F18/F19/F20). Les résolveurs sont fins : contexte,
// validation Zod, puis UN cas d'usage (api-graphql §5).

export const ProjectStatusEnum = builder.enumType("ProjectStatus", {
  values: ["draft", "published"] as const,
});

// V1.5 — Enums
export const ProjectTypeEnum = builder.enumType("ProjectType", {
  values: projectTypeValues,
});

export const ProjectReactionTypeEnum = builder.enumType("ProjectReactionType", {
  values: projectReactionTypeValues,
});

export const ProjectRef = builder.objectRef<Project>("Project").implement({
  description: "Projet d'un membre.",
  fields: (t) => ({
    id: t.exposeID("id"),
    title: t.exposeString("title"),
    body: t.exposeString("body"),
    status: t.field({ type: ProjectStatusEnum, resolve: (project) => project.status }),
    // V1.5 — Type de projet (F18)
    type: t.field({ type: ProjectTypeEnum, resolve: (project) => project.type }),
    coverUrl: t.string({
      nullable: true,
      resolve: (project) =>
        project.coverKey ? getPublicUrl(project.coverKey) : null,
    }),
    publishedAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (project) => project.publishedAt,
    }),
    createdAt: t.field({ type: "DateTime", resolve: (project) => project.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (project) => project.updatedAt }),
    author: t.field({
      type: ProfileSummaryRef,
      resolve: async (project, _args, ctx) => {
        const author = await ctx.loaders.authorById.load(project.authorId);
        if (!author) throw new Error("Auteur introuvable.");
        return author;
      },
    }),
    skills: t.field({
      type: [SkillRef],
      resolve: (project, _args, ctx) =>
        ctx.loaders.skillsByProjectId.load(project.id),
    }),
    // V1.5 — Réactions (F19) — via DataLoader
    reactions: t.field({
      type: [ProjectReactionRef],
      resolve: (project, _args, ctx) => ctx.loaders.projectReactionsByProjectId.load(project.id),
    }),
    // V1.5 — Commentaires (F19) — via DataLoader
    comments: t.field({
      type: ProjectCommentConnectionRef,
      args: { first: t.arg.int(), after: t.arg.string() },
      resolve: (project, args, ctx) => ctx.loaders.projectCommentsByProjectId.load({
        projectId: project.id,
        first: args.first ?? 20,
        after: args.after ?? undefined,
      }),
    }),
    // V1.5 — Suiveurs (F19)
    followerCount: t.field({
      type: "Int",
      resolve: (project, _args, ctx) => ctx.loaders.projectFollowerCountByProjectId.load(project.id),
    }),
    isFollowed: t.field({
      type: "Boolean",
      resolve: (project, _args, ctx) => {
        if (!ctx.profileId) return false;
        return ctx.loaders.projectFollowedByProfileId.load({ projectId: project.id, profileId: ctx.profileId });
      },
    }),
    followers: t.field({
      type: ProjectFollowerConnectionRef,
      args: { first: t.arg.int(), after: t.arg.string() },
      resolve: (project, args, ctx) => ctx.loaders.projectFollowersByProjectId.load({
        projectId: project.id,
        first: args.first ?? 20,
        after: args.after ?? undefined,
      }),
    }),
    // V1.5 — Updates (F20)
    updateCount: t.field({
      type: "Int",
      resolve: (project, _args, ctx) => ctx.loaders.projectUpdateCountByProjectId.load(project.id),
    }),
    updates: t.field({
      type: ProjectUpdateConnectionRef,
      args: { first: t.arg.int(), after: t.arg.string() },
      resolve: (project, args, ctx) => ctx.loaders.projectUpdatesByProjectId.load({
        projectId: project.id,
        first: args.first ?? 20,
        after: args.after ?? undefined,
      }),
    }),
  }),
});

const ProjectEdgeRef = builder.objectRef<ProjectEdge>("ProjectEdge").implement({
  fields: (t) => ({
    cursor: t.exposeString("cursor"),
    node: t.field({ type: ProjectRef, resolve: (edge) => edge.node }),
  }),
});

const ProjectConnectionRef = builder
  .objectRef<ProjectConnectionPage>("ProjectConnection")
  .implement({
    fields: (t) => ({
      edges: t.field({ type: [ProjectEdgeRef], resolve: (page) => page.edges }),
      pageInfo: t.field({ type: PageInfoRef, resolve: (page) => page.pageInfo }),
    }),
  });

const CreateProjectInput = builder.inputType("CreateProjectInput", {
  fields: (t) => ({
    title: t.string({ required: true }),
    body: t.string({ required: true }),
    skillSlugs: t.stringList(),
    coverKey: t.string(),
    type: t.field({ type: ProjectTypeEnum }),
  }),
});

const UpdateProjectInput = builder.inputType("UpdateProjectInput", {
  fields: (t) => ({
    title: t.string(),
    body: t.string(),
    skillSlugs: t.stringList(),
    coverKey: t.string(),
    type: t.field({ type: ProjectTypeEnum }),
  }),
});

builder.queryFields((t) => ({
  myProjects: t.field({
    type: ProjectConnectionRef,
    args: { first: t.arg.int(), after: t.arg.string() },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const useCaseCtx = requireProfile(ctx);
        const { first } = validateInput(listProjectsQuerySchema, {
          first: args.first ?? undefined,
          after: args.after ?? undefined,
        });
        return listMyProjects(useCaseCtx, first, args.after ?? undefined);
      }),
  }),

  projects: t.field({
    type: ProjectConnectionRef,
    args: {
      first: t.arg.int(),
      after: t.arg.string(),
      skillSlug: t.arg.string(),
      authorUsername: t.arg.string(),
    },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const { first, skillSlugs, authorUsername } = validateInput(
          listProjectsQuerySchema,
          {
            first: args.first ?? undefined,
            after: args.after ?? undefined,
            skillSlugs: args.skillSlug ? [args.skillSlug] : undefined,
            authorUsername: args.authorUsername ?? undefined,
          },
        );
        return listProjects(
          { userId: ctx.userId, profileId: ctx.profileId },
          {
            limit: first,
            after: args.after ?? undefined,
            skillSlug: skillSlugs?.[0],
            authorUsername,
          },
        );
      }),
  }),

  project: t.field({
    type: ProjectRef,
    nullable: true,
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const id = validateInput(projectIdSchema, String(args.id));
        return getVisibleProject(
          { userId: ctx.userId, profileId: ctx.profileId },
          id,
        );
      }),
  }),
}));

builder.mutationFields((t) => ({
  createProject: t.field({
    type: ProjectRef,
    args: { input: t.arg({ type: CreateProjectInput, required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const useCaseCtx = requireProfile(ctx);
        const input = validateInput(createProjectSchema, {
          title: args.input.title,
          body: args.input.body,
          skillSlugs: args.input.skillSlugs ?? [],
          coverKey: args.input.coverKey ?? undefined,
          type: args.input.type ?? undefined,
        });
        return createProject(useCaseCtx, input);
      }),
  }),

  updateProject: t.field({
    type: ProjectRef,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateProjectInput, required: true }),
    },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const useCaseCtx = requireProfile(ctx);
        const id = validateInput(projectIdSchema, String(args.id));
        const input = validateInput(updateProjectSchema, {
          title: args.input.title ?? undefined,
          body: args.input.body ?? undefined,
          skillSlugs: args.input.skillSlugs ?? undefined,
          coverKey: args.input.coverKey === undefined ? undefined : args.input.coverKey,
          type: args.input.type ?? undefined,
        });
        return updateProject(useCaseCtx, id, input);
      }),
  }),

  deleteProject: t.field({
    type: "Boolean",
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const useCaseCtx = requireProfile(ctx);
        const id = validateInput(projectIdSchema, String(args.id));
        return deleteProject(useCaseCtx, id);
      }),
  }),

  publishProject: t.field({
    type: ProjectRef,
    args: { id: t.arg.id({ required: true }), coverKey: t.arg.string() },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const useCaseCtx = requireProfile(ctx);
        const id = validateInput(projectIdSchema, String(args.id));
        const { coverKey } = validateInput(publishProjectSchema, {
          coverKey: args.coverKey ?? undefined,
        });
        return publishProject(useCaseCtx, id, coverKey ?? null);
      }),
  }),

  unpublishProject: t.field({
    type: ProjectRef,
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const useCaseCtx = requireProfile(ctx);
        const id = validateInput(projectIdSchema, String(args.id));
        return unpublishProject(useCaseCtx, id);
      }),
  }),
}));

// ─── V1.5 — Types de réaction projet (F19) ──────────────────────────────────

export const ProjectReactionRef = builder.objectRef<ProjectReactionCounts>("ProjectReaction").implement({
  fields: (t) => ({
    type: t.field({ type: ProjectReactionTypeEnum, resolve: (r) => r.type }),
    count: t.exposeInt("count"),
    hasReacted: t.exposeBoolean("hasReacted"),
  }),
});

// ─── V1.5 — Types de commentaire projet (F19) ───────────────────────────────

export const ProjectCommentRef = builder.objectRef<ProjectCommentWithAuthor>("ProjectComment");

ProjectCommentRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    body: t.exposeString("body"),
    createdAt: t.field({ type: "DateTime", resolve: (c) => c.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (c) => c.updatedAt }),
    author: t.field({
      type: ProfileSummaryRef,
      resolve: (c) => c.author,
    }),
    replies: t.field({
      type: [ProjectCommentRef],
      resolve: (c) => c.replies,
    }),
    depth: t.exposeInt("depth"),
  }),
});

const ProjectCommentEdgeRef = builder.objectRef<{ cursor: string; node: ProjectCommentWithAuthor }>("ProjectCommentEdge").implement({
  fields: (t) => ({
    cursor: t.exposeString("cursor"),
    node: t.field({ type: ProjectCommentRef, resolve: (e) => e.node }),
  }),
});

export const ProjectCommentConnectionRef = builder
  .objectRef<{ edges: { cursor: string; node: ProjectCommentWithAuthor }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>("ProjectCommentConnection")
  .implement({
    fields: (t) => ({
      edges: t.field({ type: [ProjectCommentEdgeRef], resolve: (c) => c.edges }),
      pageInfo: t.field({ type: PageInfoRef, resolve: (c) => c.pageInfo }),
    }),
  });

// ─── V1.5 — Types de suiveur projet (F19) ──────────────────────────────────

export const ProjectFollowerRef = builder.objectRef<ProjectFollowerWithProfile>("ProjectFollower").implement({
  fields: (t) => ({
    profile: t.field({
      type: ProfileSummaryRef,
      resolve: (f) => f.profile,
    }),
    createdAt: t.field({ type: "DateTime", resolve: (f) => f.createdAt }),
  }),
});

const ProjectFollowerEdgeRef = builder.objectRef<{ cursor: string; node: ProjectFollowerWithProfile }>("ProjectFollowerEdge").implement({
  fields: (t) => ({
    cursor: t.exposeString("cursor"),
    node: t.field({ type: ProjectFollowerRef, resolve: (e) => e.node }),
  }),
});

export const ProjectFollowerConnectionRef = builder
  .objectRef<{ edges: { cursor: string; node: ProjectFollowerWithProfile }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>("ProjectFollowerConnection")
  .implement({
    fields: (t) => ({
      edges: t.field({ type: [ProjectFollowerEdgeRef], resolve: (c) => c.edges }),
      pageInfo: t.field({ type: PageInfoRef, resolve: (c) => c.pageInfo }),
    }),
  });

// ─── V1.5 — Types d'update projet (F20) ─────────────────────────────────────

export const ProjectUpdateRef = builder.objectRef<ProjectUpdateWithAuthor>("ProjectUpdate").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    body: t.exposeString("body"),
    imageUrl: t.string({
      nullable: true,
      resolve: (u) => u.imageKey ? getPublicUrl(u.imageKey) : null,
    }),
    createdAt: t.field({ type: "DateTime", resolve: (u) => u.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (u) => u.updatedAt }),
    author: t.field({
      type: ProfileSummaryRef,
      resolve: (u) => u.author,
    }),
  }),
});

const ProjectUpdateEdgeRef = builder.objectRef<{ cursor: string; node: ProjectUpdateWithAuthor }>("ProjectUpdateEdge").implement({
  fields: (t) => ({
    cursor: t.exposeString("cursor"),
    node: t.field({ type: ProjectUpdateRef, resolve: (e) => e.node }),
  }),
});

export const ProjectUpdateConnectionRef = builder
  .objectRef<{ edges: { cursor: string; node: ProjectUpdateWithAuthor }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>("ProjectUpdateConnection")
  .implement({
    fields: (t) => ({
      edges: t.field({ type: [ProjectUpdateEdgeRef], resolve: (c) => c.edges }),
      pageInfo: t.field({ type: PageInfoRef, resolve: (c) => c.pageInfo }),
    }),
  });

// ─── Inputs V1.5 ────────────────────────────────────────────────────────────

const AddProjectReactionInput = builder.inputType("AddProjectReactionInput", {
  fields: (t) => ({
    projectId: t.id({ required: true }),
    type: t.field({ type: ProjectReactionTypeEnum, required: true }),
  }),
});

const CreateProjectCommentInput = builder.inputType("CreateProjectCommentInput", {
  fields: (t) => ({
    projectId: t.id({ required: true }),
    parentId: t.id(),
    body: t.string({ required: true }),
  }),
});

const FollowProjectInput = builder.inputType("FollowProjectInput", {
  fields: (t) => ({
    projectId: t.id({ required: true }),
  }),
});

const CreateProjectUpdateInput = builder.inputType("CreateProjectUpdateInput", {
  fields: (t) => ({
    projectId: t.id({ required: true }),
    body: t.string({ required: true }),
    imageKey: t.string(),
  }),
});

const DeleteProjectUpdateInput = builder.inputType("DeleteProjectUpdateInput", {
  fields: (t) => ({
    id: t.id({ required: true }),
  }),
});

// ─── Queries V1.5 ────────────────────────────────────────────────────────────

builder.queryFields((t) => ({
  // Catalogue projets avec filtres avancés (F18)
  projectsV15: t.field({
    type: ProjectConnectionRef,
    args: {
      first: t.arg.int(),
      after: t.arg.string(),
      skillSlugs: t.arg.stringList(),
      projectTypes: t.arg({ type: [ProjectTypeEnum] }),
      authorUsername: t.arg.string(),
      search: t.arg.string(),
    },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const useCaseCtx = requireProfile(ctx);
        const { first, skillSlugs, projectTypes, authorUsername, search } = validateInput(listProjectsV15QuerySchema, {
          first: args.first ?? undefined,
          after: args.after ?? undefined,
          skillSlugs: args.skillSlugs ?? undefined,
          projectTypes: args.projectTypes ?? undefined,
          authorUsername: args.authorUsername ?? undefined,
          search: args.search ?? undefined,
        });
        return listProjectsV15(useCaseCtx, { limit: first, after: args.after ?? undefined, skillSlugs, projectTypes, authorUsername, search });
      }),
  }),
}));

// ─── Mutations V1.5 ──────────────────────────────────────────────────────────

builder.mutationFields((t) => ({
  // F19 — Réactions
  addProjectReaction: t.field({
    type: ProjectReactionRef,
    args: { input: t.arg({ type: AddProjectReactionInput, required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const input = validateInput(addProjectReactionSchema, {
          projectId: args.input.projectId,
          type: args.input.type,
        });
        return addProjectReaction(requireProfile(ctx), input);
      }),
  }),

  removeProjectReaction: t.field({
    type: "Boolean",
    args: { projectId: t.arg.id({ required: true }), type: t.arg({ type: ProjectReactionTypeEnum, required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        return removeProjectReaction(requireProfile(ctx), String(args.projectId), args.type);
      }),
  }),

  // F19 — Commentaires
  createProjectComment: t.field({
    type: ProjectCommentRef,
    args: { input: t.arg({ type: CreateProjectCommentInput, required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const input = validateInput(createProjectCommentSchema, {
          projectId: args.input.projectId,
          parentId: args.input.parentId ?? undefined,
          body: args.input.body,
        });
        const comment = await createProjectComment(requireProfile(ctx), input);
        const author = await ctx.loaders.authorById.load(comment.authorId);
        if (!author) throw new Error("Auteur introuvable.");
        return { ...comment, author, replies: [], depth: 0 };
      }),
  }),

  deleteProjectComment: t.field({
    type: "Boolean",
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        await deleteProjectComment(requireProfile(ctx), String(args.id));
        return true;
      }),
  }),

  // F19 — Suivi
  followProject: t.field({
    type: "Boolean",
    args: { input: t.arg({ type: FollowProjectInput, required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const input = validateInput(followProjectSchema, { projectId: args.input.projectId });
        return followProject(requireProfile(ctx), input.projectId);
      }),
  }),

  unfollowProject: t.field({
    type: "Boolean",
    args: { projectId: t.arg.id({ required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        return unfollowProject(requireProfile(ctx), String(args.projectId));
      }),
  }),

  // F20 — Updates
  createProjectUpdate: t.field({
    type: ProjectUpdateRef,
    args: { input: t.arg({ type: CreateProjectUpdateInput, required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const input = validateInput(createProjectUpdateSchema, {
          projectId: args.input.projectId,
          body: args.input.body,
          imageKey: args.input.imageKey ?? undefined,
        });
        const update = await createProjectUpdate(requireProfile(ctx), input);
        const author = await ctx.loaders.authorById.load(update.authorId);
        if (!author) throw new Error("Auteur introuvable.");
        return { ...update, author };
      }),
  }),

  deleteProjectUpdate: t.field({
    type: "Boolean",
    args: { input: t.arg({ type: DeleteProjectUpdateInput, required: true }) },
    resolve: (_root, args, ctx) =>
      run(async () => {
        const input = validateInput(deleteProjectUpdateSchema, { id: args.input.id });
        await deleteProjectUpdate(requireProfile(ctx), String(input.id));
        return true;
      }),
  }),
}));
