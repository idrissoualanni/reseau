"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryUploader } from "@/components/ui/gallery-uploader";
import { TextareaField } from "@/components/textarea-field";
import { createPostAction, type PostFormState } from "@/lib/actions/posts";
import { MAX_POST_BODY } from "@/lib/posts";

const initialState: PostFormState = {};

// Composition d'un post (F11/F12) : texte brut (max 5000) et galerie de 5
// images maximum (V1.5). Les images sont déjà envoyées en PUT présigné au
// moment du choix ; la soumission ne fait que publier les clés.
export function PostComposer() {
  const [state, formAction, pending] = useActionState(createPostAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p
          role="alert"
          aria-live="polite"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <TextareaField
        name="body"
        label="Quoi de neuf ?"
        placeholder="Partage une activité, une découverte, une question…"
        maxLength={MAX_POST_BODY}
        error={state.fieldErrors?.body}
        hint={`${MAX_POST_BODY} caractères maximum.`}
        rows={8}
      />

      <GalleryUploader kind="post-image" coverField="imageKey" />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {pending ? "Publication…" : "Publier"}
        </Button>
      </div>
    </form>
  );
}
