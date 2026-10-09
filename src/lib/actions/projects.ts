"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getOwnProfile } from "@/lib/profile";
import {
  createProject,
  deleteProject,
  publishProject,
  unpublishProject,
  updateProject,
  type ProjectConnectionPage,
} from "@/lib/projects";
import {
  createProjectSchema,
  projectIdSchema,
  updateProjectSchema,
} from "@/lib/validation/project";

// Actions serveur des projets (F05/F06). L'identité vient de la session ; le
// profil est chargé ici, une seule fois par action.

export type ProjectFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};
export type ProjectListState = ProjectFormState & { page?: ProjectConnectionPage };

function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    result[key] ??= issue.message;
  }
  return result;
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

function skillSlugs(formData: FormData): string[] {
  return formData.getAll("skillSlugs").map(String).filter((value) => value.length > 0);
}

function toErrorState(error: unknown): ProjectFormState {
  if (error instanceof AppError) {
    if (error.code === "UNAUTHENTICATED") {
      return { error: "Ta session a expiré, reconnecte-toi." };
    }
    return { error: error.message };
  }
  return { error: "Une erreur est survenue, réessaie." };
}

async function requireUseCaseContext(): Promise<{ userId: string; profileId: string }> {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");
  return { userId: session.user.id, profileId: profile.id };
}

// « Publier » à la création (F06) : crée le brouillon puis le publie dans la
// même action, afin que la fiche UX « action principale Publier » tienne.
export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const ctx = await requireUseCaseContext();
  const parsed = createProjectSchema.safeParse({
    title: text(formData, "title"),
    body: text(formData, "body"),
    skillSlugs: skillSlugs(formData),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    const project = await createProject(ctx, parsed.data);
    if (formData.get("submit") === "publish") {
      await publishProject(ctx, project.id);
    }
  } catch (error) {
    return toErrorState(error);
  }

  redirect("/me/projects");
}

export async function updateProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const ctx = await requireUseCaseContext();
  const id = text(formData, "id");
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success) return { error: "Identifiant invalide." };

  const parsed = updateProjectSchema.safeParse({
    title: text(formData, "title"),
    body: text(formData, "body"),
    skillSlugs: skillSlugs(formData),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    await updateProject(ctx, parsedId.data, parsed.data);
  } catch (error) {
    return toErrorState(error);
  }

  redirect("/me/projects");
}

export async function deleteProjectAction(formData: FormData): Promise<ProjectFormState> {
  const ctx = await requireUseCaseContext();
  const id = text(formData, "id");
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success) return { error: "Identifiant invalide." };

  try {
    await deleteProject(ctx, parsedId.data);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/me/projects");
  return { success: "Projet supprimé." };
}

export async function publishProjectAction(formData: FormData): Promise<ProjectFormState> {
  const ctx = await requireUseCaseContext();
  const id = text(formData, "id");
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success) return { error: "Identifiant invalide." };

  try {
    await publishProject(ctx, parsedId.data);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/me/projects");
  return { success: "Projet publié." };
}

export async function unpublishProjectAction(formData: FormData): Promise<ProjectFormState> {
  const ctx = await requireUseCaseContext();
  const id = text(formData, "id");
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success) return { error: "Identifiant invalide." };

  try {
    await unpublishProject(ctx, parsedId.data);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/me/projects");
  return { success: "Projet repassé en brouillon." };
}