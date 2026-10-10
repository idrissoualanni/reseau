"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import {
  addCommentAction,
  deleteCommentAction,
  type PostFormState,
} from "@/lib/actions/posts";
import { MAX_COMMENT_BODY } from "@/lib/posts";
import type { FeedComment } from "@/lib/posts-feed";

type CommentThreadProps = {
  postId: string;
  comments: FeedComment[];
  viewerId: string | null;
};

const initialState: PostFormState = {};
const MAX_DEPTH = 3;

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

// Un commentaire (ou une réponse) avec son formulaire « Répondre » repliable.
function CommentItem({
  comment,
  postId,
  viewerId,
}: {
  comment: FeedComment;
  postId: string;
  viewerId: string | null;
}) {
  const [replying, setReplying] = useState(false);

  // Une réponse au plus profond (`depth === MAX_DEPTH`) ne peut plus être
  // répondu : on garde l'indentation visuelle bornée.
  const canReply = comment.depth < MAX_DEPTH - 1;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Avatar
          name={comment.author?.displayName ?? "?"}
          src={null}
          size="md"
          className="mt-0.5 size-7 text-xs"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {comment.author ? (
              <Link
                href={`/u/${comment.author.username}`}
                className="hover:underline focus-visible:ring-ring rounded-sm text-sm font-medium outline-none focus-visible:ring-2"
              >
                {comment.author.displayName}
              </Link>
            ) : (
              <span className="text-sm font-medium">Membre</span>
            )}
            <time dateTime={comment.createdAt} className="text-muted-foreground/70 text-xs">
              {formatDate(comment.createdAt)}
            </time>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.body}</p>

          <div className="flex items-center gap-3">
            {canReply ? (
              <button
                type="button"
                onClick={() => setReplying((value) => !value)}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm text-xs outline-none focus-visible:ring-2"
              >
                <MessageCircle className="size-3.5" />
                Répondre
              </button>
            ) : null}
            {viewerId && comment.author?.id === viewerId ? (
              <form
                action={(formData) => {
                  void deleteCommentAction(formData);
                }}
              >
                <input type="hidden" name="id" value={comment.id} />
                <button
                  type="submit"
                  className="text-muted-foreground hover:text-destructive focus-visible:ring-ring rounded-sm text-xs outline-none focus-visible:ring-2"
                >
                  Supprimer
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>

      {replying && canReply ? (
        <ReplyForm postId={postId} parentId={comment.id} onDone={() => setReplying(false)} />
      ) : null}
    </div>
  );
}

function ReplyForm({
  postId,
  parentId,
  onDone,
}: {
  postId: string;
  parentId: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(addCommentAction, initialState);

  return (
    <form action={formAction} className="space-y-2 pl-9">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="parentId" value={parentId} />
      <textarea
        name="body"
        placeholder="Écris une réponse…"
        maxLength={MAX_COMMENT_BODY}
        rows={2}
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
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {pending ? "Envoi…" : "Répondre"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

// Fil de commentaires d'un post (F11) : indentation bornée à 3 niveaux
// visuels (fiche F11 règle 3), réponses imbriquées, suppression par l'auteur.
export function CommentThread({ postId, comments, viewerId }: CommentThreadProps) {
  const rootComments = comments.filter((comment) => comment.parentId === null);

  return (
    <div className="space-y-4">
      {rootComments.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun commentaire. Sois le premier !</p>
      ) : null}

      {rootComments.map((comment) => (
        <CommentTree
          key={comment.id}
          comment={comment}
          all={comments}
          postId={postId}
          viewerId={viewerId}
        />
      ))}
    </div>
  );
}

function CommentTree({
  comment,
  all,
  postId,
  viewerId,
}: {
  comment: FeedComment;
  all: FeedComment[];
  postId: string;
  viewerId: string | null;
}) {
  const children = all.filter((candidate) => candidate.parentId === comment.id);

  return (
    <div className="space-y-3">
      <CommentItem comment={comment} postId={postId} viewerId={viewerId} />
      {children.length > 0 ? (
        <div className="border-s-muted ml-9 space-y-3 border-s-2 ps-3">
          {children.map((child) => (
            <CommentTree key={child.id} comment={child} all={all} postId={postId} viewerId={viewerId} />
          ))}
        </div>
      ) : null}
    </div>
  );
}