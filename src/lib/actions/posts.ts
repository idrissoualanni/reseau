"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getOwnProfile } from "@/lib/profile";
import { galleryUrls, getPublicUrl } from "@/lib/storage";
import { loadPostsFeed, type PostFeedPage } from "@/lib/posts-feed";
import {
  addComment,
  createCommentSchema,
  createPost,
  createPostSchema,
  deleteComment,
  deletePost,
  listOwnPosts,
  togglePostLike,
  updatePost,
  updatePostSchema,
  type PostLikeResult,
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

// Galerie : images 2 à 5 envoyées par le formulaire (4 maximum).
function galleryKeys(formData: FormData): string[] {
  return formData
    .getAll("imageKeys")
    .map((value) => String(value))
    .filter((value) => value.length > 0)
    .slice(0, 4);
}

async function requireUseCaseContext(): Promise<{ userId: string; profileId: string }> {  const session = await requireSession();
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
    imageKeys: galleryKeys(formData),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  // Publication puis redirection vers le fil, post mis en évidence via
  // l'ancre `#post-<id>` (variant `target:` de la carte).
  const result = await createPost(ctx, parsed.data).then(
    (post) => ({ ok: true as const, post }),
    (error) => ({ ok: false as const, error }),
  );
  if (!result.ok) return toErrorState(result.error);

  revalidatePath("/posts");
  redirect(`/posts#post-${result.post.id}`);
}

// Édition d'un post : champ imageKey absent = conserver, vide = retirer,
// valeur = remplacer (la clé est vérifiée par le cas d'usage).
export async function updatePostAction(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const ctx = await requireUseCaseContext();
  const rawImageKey = formData.get("imageKey");
  const imageKey =
    rawImageKey === null ? undefined : String(rawImageKey) || null;

  const parsed = updatePostSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    body: String(formData.get("body") ?? ""),
    imageKey,
    imageKeys: formData.has("imageKeys") ? galleryKeys(formData) : undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    await updatePost(ctx, parsed.data);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/posts");
  revalidatePath("/me/posts");
  revalidatePath(`/posts/${parsed.data.id}`);
  redirect(`/posts/${parsed.data.id}`);
}

// Suppression depuis l'espace de gestion : retour explicite à la liste.
export async function deletePostAndRedirectAction(formData: FormData): Promise<PostFormState> {
  const ctx = await requireUseCaseContext();
  const parsedId = postIdSchema.safeParse(String(formData.get("id") ?? ""));
  if (!parsedId.success) return { error: "Identifiant invalide." };

  try {
    await deletePost(ctx, parsedId.data);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/posts");
  revalidatePath("/me/posts");
  redirect("/me/posts");
}

export async function togglePostLikeAction(
  postId: string,
): Promise<{ ok: true; data: PostLikeResult } | { ok: false; error: string }> {
  const ctx = await requireUseCaseContext();
  const parsed = postIdSchema.safeParse(postId);
  if (!parsed.success) return { ok: false, error: "Identifiant invalide." };

  try {
    const data = await togglePostLike(ctx, parsed.data);
    revalidatePath("/posts");
    revalidatePath(`/posts/${parsed.data}`);
    return { ok: true, data };
  } catch (error) {
    const state = toErrorState(error);
    return { ok: false, error: state.error ?? "Une erreur est survenue." };
  }
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

export type OwnPostSummary = {
  id: string;
  body: string;
  imageUrl: string | null;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
};

export async function loadOwnPostsPage(input: {
  after?: string;
}): Promise<{
  posts: OwnPostSummary[];
  hasNextPage: boolean;
  endCursor: string | null;
}> {
  const parsed = feedCursorSchema.safeParse(input);
  if (!parsed.success) return { posts: [], hasNextPage: false, endCursor: null };

  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const page = await listOwnPosts(
    { userId: session.user.id, profileId: profile.id },
    { limit: 20, after: parsed.data.after },
  );
  return {
    posts: page.posts.map((post) => ({
      id: post.id,
      body: post.body,
      imageUrl: post.imageKey ? getPublicUrl(post.imageKey) : null,
      imageUrls: galleryUrls(post.imageKey, post.imageKeys),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    })),
    hasNextPage: page.hasNextPage,
    endCursor: page.endCursor,
  };
}

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
