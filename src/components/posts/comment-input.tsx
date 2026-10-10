"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addCommentAction, type PostFormState } from "@/lib/actions/posts";
import { MAX_COMMENT_BODY } from "@/lib/posts";

const initialState: PostFormState = {};

// Formulaire « commenter un post » (F11), sans parentId : utilisé sur le détail.
export function CommentInput({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState(addCommentAction, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <textarea
        name="body"
        placeholder="Écris un commentaire…"
        maxLength={MAX_COMMENT_BODY}
        rows={3}
        className="bg-background focus-visible:ring-ring flex min-h-16 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
        required
      />
      {state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}
      {state.fieldErrors?.body ? (
        <p role="alert" className="text-destructive text-sm">
          {state.fieldErrors.body}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {pending ? "Envoi…" : "Commenter"}
        </Button>
      </div>
    </form>
  );
}