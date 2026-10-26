"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/avatar";
import { formatRelativeTime } from "@/lib/relative-time";
import { ChevronDown, Loader2, Reply, Trash2 } from "lucide-react";
import {
  createProjectCommentAction,
  deleteProjectCommentAction,
} from "@/lib/actions/project-social";
import type { ProjectCommentView } from "@/lib/project-social";
import { MAX_PROJECT_COMMENT_BODY, MAX_PROJECT_DEPTH } from "@/lib/validation/project";

type ProjectCommentsProps = {
  projectId: string;
  viewerId: string;
  initialComments: ProjectCommentView[];
};

export function ProjectComments({
  projectId,
  viewerId,
  initialComments,
}: ProjectCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddComment(body: string, parentId?: string) {
    if (pending) return false;
    setError(null);
    setPending(true);
    const result = await createProjectCommentAction({
      projectId,
      parentId: parentId ?? null,
      body,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setComments(result.data);
    return true;
  }

  async function handleDeleteComment(id: string) {
    if (pending) return;
    setError(null);
    setPending(true);
    const result = await deleteProjectCommentAction({ id, projectId });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setComments(result.data);
  }

  return (
    <div className="space-y-5">
      <ProjectCommentForm onSubmit={handleAddComment} pending={pending} />

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {comments.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Aucun commentaire pour l&apos;instant. Soyez le premier à réagir !
        </p>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              viewerId={viewerId}
              pending={pending}
              onDelete={handleDeleteComment}
              onReply={handleAddComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentThread({
  comment,
  viewerId,
  pending,
  onDelete,
  onReply,
  depth = 0,
}: {
  comment: ProjectCommentView;
  viewerId: string;
  pending: boolean;
  onDelete: (id: string) => Promise<void>;
  onReply: (body: string, parentId: string) => Promise<boolean>;
  depth?: number;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyPending, setReplyPending] = useState(false);
  const isOwner = comment.author.id === viewerId;
  const hasReplies = comment.replies.length > 0;
  const canReply = depth < MAX_PROJECT_DEPTH - 1;

  async function handleSubmitReply(event: React.FormEvent) {
    event.preventDefault();
    if (!replyBody.trim() || pending || replyPending) return;
    setReplyPending(true);
    const ok = await onReply(replyBody.trim(), comment.id);
    setReplyPending(false);
    if (ok) {
      setReplyBody("");
      setReplying(false);
      setShowReplies(true);
    }
  }

  return (
    <div
      className={
        depth > 0
          ? "border-border ml-4 border-l pl-4 sm:ml-8"
          : undefined
      }
    >
      <div className="flex gap-3">
        <Avatar
          name={comment.author.displayName}
          src={comment.author.avatarUrl}
          size="sm"
          className="mt-1 flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/u/${comment.author.username}`}
              className="text-sm font-medium hover:underline"
            >
              {comment.author.displayName}
            </Link>
            <span className="text-muted-foreground text-xs">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {isOwner ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto size-7"
                onClick={() => void onDelete(comment.id)}
                disabled={pending}
                aria-label="Supprimer le commentaire"
              >
                <Trash2 className="text-destructive size-3.5" />
              </Button>
            ) : null}
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap">{comment.body}</p>

          {canReply && !replying ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground mt-1 h-7 px-2"
              onClick={() => setReplying(true)}
            >
              <Reply className="size-3.5" />
              Répondre
            </Button>
          ) : null}

          {replying ? (
            <form onSubmit={handleSubmitReply} className="mt-2 space-y-2">
              <Textarea
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                placeholder="Répondre..."
                className="min-h-[60px] resize-none"
                rows={2}
                maxLength={MAX_PROJECT_COMMENT_BODY}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplying(false);
                    setReplyBody("");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyBody.trim() || pending || replyPending}
                >
                  {replyPending ? <Loader2 className="size-4 animate-spin" /> : "Répondre"}
                </Button>
              </div>
            </form>
          ) : null}

          {hasReplies ? (
            <div className="mt-3 space-y-4">
              {comment.replies.length <= 3 || showReplies ? (
                comment.replies.map((reply) => (
                  <CommentThread
                    key={reply.id}
                    comment={reply}
                    viewerId={viewerId}
                    pending={pending}
                    onDelete={onDelete}
                    onReply={onReply}
                    depth={depth + 1}
                  />
                ))
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setShowReplies(true)}
                >
                  <ChevronDown className="size-4" />
                  Voir les {comment.replies.length} réponses
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProjectCommentForm({
  onSubmit,
  pending,
}: {
  onSubmit: (body: string) => Promise<boolean>;
  pending: boolean;
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || pending || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit(body.trim());
    setSubmitting(false);
    if (ok) setBody("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Écrire un commentaire..."
        className="min-h-[80px] resize-none"
        rows={3}
        maxLength={MAX_PROJECT_COMMENT_BODY}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {body.length}/{MAX_PROJECT_COMMENT_BODY}
        </span>
        <Button type="submit" disabled={!body.trim() || pending || submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : "Commenter"}
        </Button>
      </div>
    </form>
  );
}
