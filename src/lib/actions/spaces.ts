"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { AppError, ForbiddenError } from "@/lib/errors";
import { findProfileByUserId } from "@/lib/repositories/profiles";
import {
  configureAccessMethod,
  decideMembership,
  joinSpace,
  revokeMembership,
  setMembershipRole,
} from "@/lib/spaces";
import {
  joinSpaceSchema,
  membershipDecisionSchema,
  setAccessMethodSchema,
  setMembershipRoleSchema,
  spaceAccessKindSchema,
} from "@/lib/validation/space";

// Actions serveur des espaces (F15/F17). Chaque action repasse par un cas
// d'usage qui revérifie l'autorisation côté serveur.

export type SpaceActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
  // Secret (code/lien) renvoyé UNE SEULE FOIS à la génération ; jamais persisté.
  secret?: string;
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

function isChecked(formData: FormData, name: string): boolean {
  const value = formData.get(name);
  return value === "on" || value === "true" || value === "1";
}

function toErrorState(error: unknown): SpaceActionState {
  if (error instanceof AppError) {
    if (error.code === "UNAUTHENTICATED") {
      return { error: "Ta session a expiré, reconnecte-toi." };
    }
    return { error: error.message };
  }
  return { error: "Une erreur est survenue, réessaie." };
}

// Rejoindre un espace ou demander l'accès : l'identité vient de la session.
export async function joinSpaceAction(
  _prev: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  const slug = text(formData, "slug");
  if (!slug) return { error: "Espace introuvable." };

  const parsed = joinSpaceSchema.safeParse({
    method: text(formData, "method"),
    code: text(formData, "code") || undefined,
    token: text(formData, "token") || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    const session = await requireSession();
    const profile = await findProfileByUserId(session.user.id);
    if (!profile) {
      throw new ForbiddenError("Complète ton profil avant de rejoindre un espace.");
    }
    const result = await joinSpace({ profileId: profile.id }, slug, parsed.data);
    revalidatePath("/spaces");
    revalidatePath(`/spaces/${slug}`);
    return {
      success:
        result.status === "pending"
          ? "Demande envoyée, en attente d'approbation."
          : "Tu as rejoint l'espace.",
    };
  } catch (error) {
    return toErrorState(error);
  }
}

// Approuve ou refuse une demande en attente.
export async function decideMembershipAction(
  _prev: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  const spaceId = text(formData, "spaceId");
  const membershipId = text(formData, "membershipId");
  const parsed = membershipDecisionSchema.safeParse({ action: text(formData, "action") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    const session = await requireSession();
    await decideMembership(toAdminContext(session), spaceId, membershipId, parsed.data.action);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(`/admin/spaces/${spaceId}/members`);
  return {
    success: parsed.data.action === "approve" ? "Demande approuvée." : "Demande refusée.",
  };
}

// Change le rôle d'un membre (member ↔ space_admin).
export async function setMembershipRoleAction(
  _prev: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  const spaceId = text(formData, "spaceId");
  const membershipId = text(formData, "membershipId");
  const parsed = setMembershipRoleSchema.safeParse({ role: text(formData, "role") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    const session = await requireSession();
    await setMembershipRole(toAdminContext(session), spaceId, membershipId, parsed.data);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(`/admin/spaces/${spaceId}/members`);
  return { success: "Rôle mis à jour." };
}

// Retire un membre de l'espace.
export async function revokeMembershipAction(
  _prev: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  const spaceId = text(formData, "spaceId");
  const membershipId = text(formData, "membershipId");

  try {
    const session = await requireSession();
    await revokeMembership(toAdminContext(session), spaceId, membershipId);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(`/admin/spaces/${spaceId}/members`);
  return { success: "Membre retiré." };
}

// Configure une méthode d'accès ; le secret éventuel n'est affiché qu'une fois.
export async function configureAccessMethodAction(
  _prev: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  const spaceId = text(formData, "spaceId");
  const method = spaceAccessKindSchema.safeParse(text(formData, "method"));
  if (!method.success) return { error: "Méthode d'accès inconnue." };

  const parsed = setAccessMethodSchema.safeParse({
    isActive: isChecked(formData, "isActive"),
    code: text(formData, "code") || undefined,
    regenerate: isChecked(formData, "regenerate") || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    const session = await requireSession();
    const result = await configureAccessMethod(
      toAdminContext(session),
      spaceId,
      method.data,
      parsed.data,
    );
    revalidatePath(`/admin/spaces/${spaceId}/access`);
    return result.secret
      ? { success: "Méthode enregistrée.", secret: result.secret }
      : { success: "Méthode enregistrée." };
  } catch (error) {
    return toErrorState(error);
  }
}
