"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { archiveSpace, createSpace, toAdminContext, updateSpace } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { createSpaceSchema, updateSpaceSchema } from "@/lib/validation/space";

// Actions serveur de la console d'administration (F14/F16/F17). Chaque action
// repasse par un cas d'usage qui revérifie l'autorisation plateforme.

export type AdminFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

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

function toErrorState(error: unknown): AdminFormState {
  if (error instanceof AppError) {
    if (error.code === "UNAUTHENTICATED") {
      return { error: "Ta session a expiré, reconnecte-toi." };
    }
    return { error: error.message };
  }
  return { error: "Une erreur est survenue, réessaie." };
}

export async function createSpaceAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const parsed = createSpaceSchema.safeParse({
    slug: text(formData, "slug"),
    name: text(formData, "name"),
    description: text(formData, "description"),
    type: text(formData, "type"),
    visibility: text(formData, "visibility") || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    const session = await requireSession();
    await createSpace(toAdminContext(session), parsed.data);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/admin/spaces");
  redirect("/admin/spaces");
}

export async function updateSpaceAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const id = text(formData, "id");
  const parsed = updateSpaceSchema.safeParse({
    name: text(formData, "name"),
    description: text(formData, "description"),
    visibility: text(formData, "visibility") || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    const session = await requireSession();
    await updateSpace(toAdminContext(session), id, parsed.data);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/admin/spaces");
  redirect("/admin/spaces");
}

export async function archiveSpaceAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const session = await requireSession();
    await archiveSpace(toAdminContext(session), text(formData, "id"));
  } catch (error) {
    return toErrorState(error);
  }
  revalidatePath("/admin/spaces");
  return { success: "Espace archivé." };
}
