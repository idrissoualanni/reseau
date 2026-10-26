"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getOwnProfile } from "@/lib/profile";
import {
  createProjectComment,
  createProjectUpdate,
  deleteProjectComment,
  deleteProjectUpdate,
  followProject,
  isFollowingProject,
  toggleProjectReaction,
  unfollowProject,
} from "@/lib/projects";
import {
  loadProjectComments,
  loadProjectFollowers,
  loadProjectUpdates,
  type ProjectCommentView,
  type ProjectFollowerPage,
  type ProjectReactionView,
  type ProjectUpdatePage,
  type SocialActionResult,
} from "@/lib/project-social";
import {
  addProjectReactionSchema,
  createProjectCommentSchema,
  createProjectUpdateSchema,
  projectIdSchema,
} from "@/lib/validation/project";
import type { ProjectReactionType } from "@/lib/types";

// Actions serveur des interactions projet (F19/F20). L'identité vient de la
// session ; le client ne fournit que l'identifiant du projet et le contenu.

const pageInputSchema = z
  .object({
    projectId: projectIdSchema,
    after: z.string().max(500).optional(),
  })
  .strict();

const deleteInputSchema = z
  .object({
    id: projectIdSchema,
    projectId: projectIdSchema,
  })
  .strict();

function toError(error: unknown): { ok: false; error: string } {
  if (error instanceof AppError) {
    if (error.code === "UNAUTHENTICATED") {
      return { ok: false, error: "Ta session a expiré, reconnecte-toi." };
    }
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Une erreur est survenue, réessaie." };
}

async function requireUseCaseContext(): Promise<{ userId: string; profileId: string }> {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");
  return { userId: session.user.id, profileId: profile.id };
}

export async function toggleProjectReactionAction(input: {
  projectId: string;
  type: ProjectReactionType;
}): Promise<SocialActionResult<ProjectReactionView[]>> {
  const ctx = await requireUseCaseContext();
  const parsed = addProjectReactionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Réaction invalide." };
  }

  try {
    const reactions = await toggleProjectReaction(
      ctx,
      parsed.data.projectId,
      parsed.data.type,
    );
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { ok: true, data: reactions };
  } catch (error) {
    return toError(error);
  }
}

export async function createProjectCommentAction(input: {
  projectId: string;
  parentId?: string | null;
  body: string;
}): Promise<SocialActionResult<ProjectCommentView[]>> {
  const ctx = await requireUseCaseContext();
  const parsed = createProjectCommentSchema.safeParse({
    projectId: input.projectId,
    parentId: input.parentId ?? undefined,
    body: input.body,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Commentaire invalide." };
  }

  try {
    await createProjectComment(ctx, parsed.data);
    const comments = await loadProjectComments(parsed.data.projectId);
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { ok: true, data: comments };
  } catch (error) {
    return toError(error);
  }
}

export async function deleteProjectCommentAction(input: {
  id: string;
  projectId: string;
}): Promise<SocialActionResult<ProjectCommentView[]>> {
  const ctx = await requireUseCaseContext();
  const parsed = deleteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Identifiant invalide." };
  }

  try {
    await deleteProjectComment(ctx, parsed.data.id);
    const comments = await loadProjectComments(parsed.data.projectId);
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { ok: true, data: comments };
  } catch (error) {
    return toError(error);
  }
}

export async function toggleProjectFollowAction(input: {
  projectId: string;
}): Promise<SocialActionResult<ProjectFollowerPage>> {
  const ctx = await requireUseCaseContext();
  const parsed = pageInputSchema.safeParse({ projectId: input.projectId });
  if (!parsed.success) {
    return { ok: false, error: "Identifiant invalide." };
  }

  try {
    const following = await isFollowingProject(ctx, parsed.data.projectId);
    if (following) {
      await unfollowProject(ctx, parsed.data.projectId);
    } else {
      await followProject(ctx, parsed.data.projectId);
    }
    const page = await loadProjectFollowers(ctx, parsed.data.projectId);
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { ok: true, data: page };
  } catch (error) {
    return toError(error);
  }
}

export async function loadProjectFollowersPageAction(input: {
  projectId: string;
  after?: string;
}): Promise<SocialActionResult<ProjectFollowerPage>> {
  const ctx = await requireUseCaseContext();
  const parsed = pageInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Identifiant invalide." };
  }

  try {
    const page = await loadProjectFollowers(ctx, parsed.data.projectId, {
      after: parsed.data.after,
    });
    return { ok: true, data: page };
  } catch (error) {
    return toError(error);
  }
}

export async function createProjectUpdateAction(input: {
  projectId: string;
  body?: string;
  imageKey?: string | null;
}): Promise<SocialActionResult<ProjectUpdatePage>> {
  const ctx = await requireUseCaseContext();
  const parsed = createProjectUpdateSchema.safeParse({
    projectId: input.projectId,
    body: input.body?.trim() || undefined,
    imageKey: input.imageKey ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Mise à jour invalide." };
  }

  try {
    await createProjectUpdate(ctx, parsed.data);
    const page = await loadProjectUpdates(parsed.data.projectId);
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { ok: true, data: page };
  } catch (error) {
    return toError(error);
  }
}

export async function deleteProjectUpdateAction(input: {
  id: string;
  projectId: string;
}): Promise<SocialActionResult<ProjectUpdatePage>> {
  const ctx = await requireUseCaseContext();
  const parsed = deleteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Identifiant invalide." };
  }

  try {
    await deleteProjectUpdate(ctx, parsed.data.id);
    const page = await loadProjectUpdates(parsed.data.projectId);
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { ok: true, data: page };
  } catch (error) {
    return toError(error);
  }
}

export async function loadProjectUpdatesPageAction(input: {
  projectId: string;
  after?: string;
}): Promise<SocialActionResult<ProjectUpdatePage>> {
  const ctx = await requireUseCaseContext();
  const parsed = pageInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Identifiant invalide." };
  }

  try {
    const page = await loadProjectUpdates(parsed.data.projectId, {
      after: parsed.data.after,
    });
    return { ok: true, data: page };
  } catch (error) {
    return toError(error);
  }
}
