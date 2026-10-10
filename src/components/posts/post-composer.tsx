"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/textarea-field";
import {
  createPostAction,
  type PostFormState,
} from "@/lib/actions/posts";
import { MAX_POST_BODY } from "@/lib/posts";

const initialState: PostFormState = {};

// Champ de publication d'un post (F11) : texte brut, max 5000 caractères.
// Réalise le parcours « publier un post » de la fiche UX posts.md.
export function PostComposer() {
  const [state, formAction, pending] = useActionState(createPostAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
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
        rows={4}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {pending ? "Publication…" : "Publier"}
        </Button>
      </div>
    </form>
  );
}