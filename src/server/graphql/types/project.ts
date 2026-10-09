import { builder } from "@/server/graphql/builder";
import type { Project } from "@/lib/types";
import type { ProjectConnectionPage, ProjectEdge } from "@/lib/projects";
import {
  createProject,
  deleteProject,
  getVisibleProject,
  listMyProjects,
  listProjects,
  publishProject,
  unpublishProject,
  updateProject,
} from "@/lib/projects";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  projectIdSchema,
  publishProjectSchema,
  updateProjectSchema,
} from "@/lib/validation/project";
import { getPublicUrl } from "@/lib/storage";
import { requireProfile, run, validateInput } from "@/server/graphql/errors";
import { PageInfoRef } from "./connection";
import { ProfileSummaryRef } from "./profile";
import { SkillRef } from "./skill";

// Type Project et opérations (F05/F06). Les résolveurs sont fins : contexte,
// validation Zod, puis UN cas d'usage (api-graphql §5).

export const ProjectStatusEnum = builder.enumType("ProjectStatus", {
  values: ["draft", "published"] as const,
});

export const ProjectRef = builder.objectRef<Project>("Project").implement({
  description: "Projet d'un membre.",
  fields: (t) => ({
    id: t.exposeID("id"),
    title: t.exposeString("title"),
    body: t.exposeString("body"),
    status: t.field({ type: ProjectStatusEnum, resolve: (project) => project.status }),
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
  }),
});

const UpdateProjectInput = builder.inputType("UpdateProjectInput", {
  fields: (t) => ({
    title: t.string(),
    body: t.string(),
    skillSlugs: t.stringList(),
    coverKey: t.string(),
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
        const { first, skillSlug, authorUsername } = validateInput(
          listProjectsQuerySchema,
          {
            first: args.first ?? undefined,
            after: args.after ?? undefined,
            skillSlug: args.skillSlug ?? undefined,
            authorUsername: args.authorUsername ?? undefined,
          },
        );
        return listProjects(
          { userId: ctx.userId, profileId: ctx.profileId },
          {
            limit: first,
            after: args.after ?? undefined,
            skillSlug,
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
