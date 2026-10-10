"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { createProfile, requireOwnProfile, updateProfile } from "@/lib/profile";
import { addOwnSkill, removeOwnSkill } from "@/lib/skills";
import { createProfileSchema, updateProfileSchema } from "@/lib/validation/profile";
import type { ProfileSkill } from "@/lib/types";

export type ProfileFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

export type SkillActionResult =
  | { ok: true; skill: ProfileSkill }
  | { ok: true; removedId: string }
  | { ok: false; error: string };

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

function toErrorState(error: unknown): ProfileFormState {
  if (error instanceof AppError) {
    if (error.code === "UNAUTHENTICATED") {
      return { error: "Ta session a expiré, reconnecte-toi." };
    }
    return { error: error.message };
  }
  return { error: "Une erreur est survenue, réessaie." };
}

export async function createProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = createProfileSchema.safeParse({
    username: text(formData, "username"),
    displayName: text(formData, "displayName"),
    bio: text(formData, "bio"),
    schoolName: text(formData, "schoolName"),
    fieldOfStudy: text(formData, "fieldOfStudy"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    const session = await requireSession();
    await createProfile(session.user.id, parsed.data);
  } catch (error) {
    return toErrorState(error);
  }

  redirect("/me/profile");
}

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = updateProfileSchema.safeParse({
    displayName: text(formData, "displayName"),
    bio: text(formData, "bio"),
    schoolName: text(formData, "schoolName"),
    fieldOfStudy: text(formData, "fieldOfStudy"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    const session = await requireSession();
    await updateProfile(session.user.id, parsed.data);
  } catch (error) {
    return toErrorState(error);
  }

  return { success: "Profil mis à jour." };
}

// Avatar (F13) : met à jour ou retire `avatarKey` (null = retirer). La clé est
// validée et son appartenance vérifiée dans `updateProfile`. Le client a déjà
// uploadé le fichier via l'URL présignée avant d'appeler cette action.
export async function updateAvatarAction(
  avatarKey: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = updateProfileSchema.safeParse({ avatarKey });
  if (!parsed.success) return { ok: false, error: "Clé d'image invalide." };

  try {
    const session = await requireSession();
    await updateProfile(session.user.id, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    return { ok: false, error: "Une erreur est survenue, réessaie." };
  }

  return { ok: true };
}

export async function addSkillAction(name: string): Promise<SkillActionResult> {
  try {
    const session = await requireSession();
    const profile = await requireOwnProfile(session.user.id);
    const skill = await addOwnSkill(profile.id, name);
    return { ok: true, skill };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    return { ok: false, error: "Une erreur est survenue, réessaie." };
  }
}

export async function removeSkillAction(skillId: string): Promise<SkillActionResult> {
  try {
    const session = await requireSession();
    const profile = await requireOwnProfile(session.user.id);
    await removeOwnSkill(profile.id, skillId);
    return { ok: true, removedId: skillId };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    return { ok: false, error: "Une erreur est survenue, réessaie." };
  }
}
