"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryUploader } from "@/components/ui/gallery-uploader";
import { TextareaField } from "@/components/textarea-field";
import { updatePostAction, type PostFormState } from "@/lib/actions/posts";
import { MAX_POST_BODY } from "@/lib/posts";

const initialState: PostFormState = {};

type PostEditFormProps = {
  post: {
    id: string;
    body: string;
    imageKeys: string[];
    imageUrls: string[];
  };
};

// Édition d'un post (F11/F12) : le formulaire renvoie toujours la galerie
// complète, la première image restant la couverture (V1.5).
export function PostEditForm({ post }: PostEditFormProps) {
  const [state, formAction, pending] = useActionState(updatePostAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={post.id} />

      {state.error ? (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <TextareaField
        name="body"
        label="Texte du post"
        defaultValue={post.body}
        placeholder="Partage une activité, une découverte, une question…"
        maxLength={MAX_POST_BODY}
        error={state.fieldErrors?.body}
        hint={`${MAX_POST_BODY} caractères maximum.`}
        rows={8}
        required
      />

      <GalleryUploader
        kind="post-image"
        coverField="imageKey"
        initialKeys={post.imageKeys}
        initialUrls={post.imageUrls}
      />

      <div className="flex items-center justify-between gap-2">
        <Button asChild type="button" variant="ghost">
          <Link href="/me/posts">Annuler</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
