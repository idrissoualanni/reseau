"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getOwnProfile } from "@/lib/profile";
import { loadPostsFeed, type PostFeedPage } from "@/lib/posts-feed";
import {
  addComment,
  createCommentSchema,
  createPost,
  createPostSchema,
  deleteComment,
  deletePost,
} from "@/lib/posts";
import { postIdSchema } from "@/lib/validation/post";

// Actions serveur des posts et commentaires (F11). L'identité vient de la
// session ; le profil est chargé ici, une seule fois par action.

export type PostFormState = {
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

function toErrorState(error: unknown): PostFormState {
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

export async function createPostAction(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const ctx = await requireUseCaseContext();
  const parsed = createPostSchema.safeParse({
    body: String(formData.get("body") ?? ""),
    imageKey: String(formData.get("imageKey") ?? "") || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    await createPost(ctx, parsed.data);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/posts");
  return { success: "Post publié." };
}

export async function deletePostAction(formData: FormData): Promise<PostFormState> {
  const ctx = await requireUseCaseContext();
  const id = String(formData.get("id") ?? "");
  const parsedId = postIdSchema.safeParse(id);
  if (!parsedId.success) return { error: "Identifiant invalide." };

  try {
    await deletePost(ctx, parsedId.data);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/posts");
  return { success: "Post supprimé." };
}

export async function addCommentAction(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const ctx = await requireUseCaseContext();
  const parsed = createCommentSchema.safeParse({
    postId: String(formData.get("postId") ?? ""),
    parentId: String(formData.get("parentId") ?? "") || null,
    body: String(formData.get("body") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    await addComment(ctx, parsed.data);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/posts");
  return { success: "Commentaire ajouté." };
}

export async function deleteCommentAction(formData: FormData): Promise<PostFormState> {
  const ctx = await requireUseCaseContext();
  const id = String(formData.get("id") ?? "");
  const parsedId = postIdSchema.safeParse(id);
  if (!parsedId.success) return { error: "Identifiant invalide." };

  try {
    await deleteComment(ctx, parsedId.data);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/posts");
  return { success: "Commentaire supprimé." };
}

const feedCursorSchema = z.object({
  after: z.string().optional(),
});

// « Voir plus » du fil de posts (F11) : renvoie la page suivante, sérialisée
// (dates en ISO), avec les auteurs et commentaires préchargés par lots.
export async function loadPostsPage(input: { after?: string }): Promise<PostFeedPage> {
  const parsed = feedCursorSchema.safeParse(input);
  if (!parsed.success) return { edges: [], hasNextPage: false, endCursor: null };

  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  return loadPostsFeed(
    { userId: session.user.id, profileId: profile.id },
    { limit: 20, after: parsed.data.after },
  );
}
