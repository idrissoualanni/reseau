"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { togglePostLikeAction } from "@/lib/actions/posts";
import { cn } from "@/lib/utils";

type PostLikeButtonProps = {
  postId: string;
  initialLikeCount: number;
  initialHasLiked: boolean;
};

export function PostLikeButton({
  postId,
  initialLikeCount,
  initialHasLiked,
}: PostLikeButtonProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (pending) return;
    const previous = { likeCount, hasLiked };
    setError(null);
    setPending(true);
    setHasLiked(!hasLiked);
    setLikeCount((count) => Math.max(0, count + (hasLiked ? -1 : 1)));

    const result = await togglePostLikeAction(postId);
    setPending(false);
    if (result.ok) {
      setLikeCount(result.data.likeCount);
      setHasLiked(result.data.hasLiked);
    } else {
      setLikeCount(previous.likeCount);
      setHasLiked(previous.hasLiked);
      setError(result.error);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground gap-1.5 px-2"
        onClick={() => void handleToggle()}
        disabled={pending}
        aria-pressed={hasLiked}
        aria-label={`${hasLiked ? "Retirer le j'aime" : "Aimer ce post"} (${likeCount})`}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Heart
            className={cn("size-4", hasLiked && "fill-current text-destructive")}
          />
        )}
        <span className="text-xs font-medium tabular-nums">
          {likeCount > 0 ? likeCount : "J'aime"}
        </span>
      </Button>
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
