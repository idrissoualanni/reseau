"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/avatar";
import { formatRelativeTime } from "@/lib/relative-time";
import { ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type ProjectComment = {
  id: string;
  projectId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarKey: string | null;
  };
  replies: ProjectComment[];
  depth: number;
};

type ProjectCommentsProps = {
  projectId: string;
  initialComments?: ProjectComment[];
};

const MAX_VISIBLE_DEPTH = 3;

export function ProjectComments({ projectId, initialComments = [] }: ProjectCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [pending, startTransition] = useTransition();
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  async function handleAddComment(body: string, parentId?: string) {
    const optimisticComment: ProjectComment = {
      id: `temp-${Date.now()}`,
      projectId,
      parentId: parentId ?? null,
      authorId: "current-user", // TODO: get from session
      body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: "current-user",
        username: "user",
        displayName: "Vous",
        avatarKey: null,
      },
      replies: [],
      depth: parentId ? 1 : 0,
    };

    // Optimistic update
    startTransition(() => {
      if (parentId) {
        setComments((prev) => addReplyRecursive(prev, parentId, optimisticComment));
      } else {
        setComments((prev) => [optimisticComment, ...prev]);
      }
    });

    try {
      // TODO: Call GraphQL mutation
      // const result = await createProjectComment({ projectId, parentId, body });
      // Replace optimistic with real
      console.log("Add comment:", { projectId, parentId, body });
    } catch (error) {
      // Rollback
      startTransition(() => {
        setComments((prev) => removeOptimisticComment(prev, optimisticComment.id));
      });
      console.error("Failed to add comment:", error);
    }
  }

  async function handleDeleteComment(id: string) {
    const originalComments = comments;
    startTransition(() => {
      setComments((prev) => removeCommentRecursive(prev, id));
    });

    try {
      // TODO: Call GraphQL mutation
      // await deleteProjectComment(id);
      console.log("Delete comment:", id);
    } catch (error) {
      // Rollback
      startTransition(() => {
        setComments(originalComments);
      });
      console.error("Failed to delete comment:", error);
    }
  }

  return (
    <div className="space-y-4">
      {/* Add comment form */}
      <ProjectCommentForm projectId={projectId} onSubmit={handleAddComment} />

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          Aucun commentaire pour l'instant. Soyez le premier à réagir !
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentThread key={comment.id} comment={comment} onDelete={handleDeleteComment} onReply={handleAddComment} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentThread({
  comment,
  onDelete,
  onReply,
  depth = 0,
}: {
  comment: ProjectComment;
  onDelete: (id: string) => void;
  onReply: (body: string, parentId: string) => void;
  depth?: number;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const isDeep = depth >= MAX_VISIBLE_DEPTH;
  const hasReplies = comment.replies.length > 0;

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyBody.trim()) {
      onReply(replyBody.trim(), comment.id);
      setReplyBody("");
      setReplying(false);
    }
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? "ml-8 border-l-2 border-muted/20 pl-4" : ""}`}>
      <Avatar
        name={comment.author.displayName}
        src={comment.author.avatarKey}
        size="sm"
        className="flex-shrink-0 mt-1"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{comment.author.displayName}</span>
          <span className="text-muted-foreground text-xs">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {comment.author.id === "current-user" && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(comment.id)}>
              <ChevronRight className="size-3 rotate-90" />
            </Button>
          )}
        </div>
        <p className="text-sm mt-1">{comment.body}</p>

        {/* Reply form */}
        {replying && (
          <form onSubmit={handleSubmitReply} className="mt-2 flex gap-2">
            <Textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Répondre..."
              className="min-h-[60px] resize-none flex-1"
              rows={2}
            />
            <div className="flex gap-1 self-end">
              <Button type="submit" size="sm">Répondre</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setReplying(false)}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        {/* Replies */}
        {hasReplies && (
          <div className="mt-3">
            {comment.replies.length <= 3 || showReplies ? (
              <>
                {comment.replies.map((reply) => (
                  <CommentThread key={reply.id} comment={reply} onDelete={onDelete} onReply={onReply} depth={depth + 1} />
                ))}
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setShowReplies(true)}
              >
                Voir les {comment.replies.length} réponses
              </Button>
            )}
          </div>
        )}

        {/* Reply button */}
        {!replying && depth < MAX_VISIBLE_DEPTH && (
          <Button variant="ghost" size="sm" className="mt-1 text-muted-foreground" onClick={() => setReplying(true)}>
            Répondre
          </Button>
        )}
      </div>
    </div>
  );
}

function ProjectCommentForm({
  projectId,
  onSubmit,
}: {
  projectId: string;
  onSubmit: (body: string, parentId?: string) => void;
}) {
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim()) {
      onSubmit(body.trim());
      setBody("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Écrire un commentaire..."
        className="min-h-[80px] resize-none"
        rows={3}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={!body.trim() || body.trim().length > 1000}>
          Commenter
        </Button>
      </div>
    </form>
  );
}

function addReplyRecursive(comments: ProjectComment[], parentId: string, newReply: ProjectComment): ProjectComment[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return { ...comment, replies: [...comment.replies, newReply] };
    }
    if (comment.replies.length > 0) {
      return { ...comment, replies: addReplyRecursive(comment.replies, parentId, newReply) };
    }
    return comment;
  });
}

function removeCommentRecursive(comments: ProjectComment[], id: string): ProjectComment[] {
  return comments
    .filter((comment) => comment.id !== id)
    .map((comment) => ({
      ...comment,
      replies: removeCommentRecursive(comment.replies, id),
    }));
}

function removeOptimisticComment(comments: ProjectComment[], optimisticId: string): ProjectComment[] {
  return removeCommentRecursive(comments, optimisticId);
}