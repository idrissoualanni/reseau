"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import {
  loadProjectFollowersPageAction,
  toggleProjectFollowAction,
} from "@/lib/actions/project-social";
import type { ProjectFollowerView } from "@/lib/project-social";

type ProjectFollowersProps = {
  projectId: string;
  isAuthor: boolean;
  initialFollowerCount: number;
  initialIsFollowed: boolean;
  initialFollowers: ProjectFollowerView[];
  initialHasNextPage: boolean;
  initialEndCursor: string | null;
};

export function ProjectFollowers({
  projectId,
  isAuthor,
  initialFollowerCount,
  initialIsFollowed,
  initialFollowers,
  initialHasNextPage,
  initialEndCursor,
}: ProjectFollowersProps) {
  const [followers, setFollowers] = useState(initialFollowers);
  const [count, setCount] = useState(initialFollowerCount);
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [endCursor, setEndCursor] = useState(initialEndCursor);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleFollow() {
    if (pending) return;
    setError(null);
    setPending(true);
    const result = await toggleProjectFollowAction({ projectId });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFollowers(result.data.followers);
    setCount(result.data.followerCount);
    setIsFollowed(result.data.isFollowed);
    setHasNextPage(result.data.hasNextPage);
    setEndCursor(result.data.endCursor);
  }

  async function loadMore() {
    if (pending || !hasNextPage || !endCursor) return;
    setError(null);
    setPending(true);
    const result = await loadProjectFollowersPageAction({
      projectId,
      after: endCursor,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFollowers((current) => [
      ...current,
      ...result.data.followers.filter(
        (follower) => !current.some((item) => item.profileId === follower.profileId),
      ),
    ]);
    setCount(result.data.followerCount);
    setHasNextPage(result.data.hasNextPage);
    setEndCursor(result.data.endCursor);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!isAuthor ? (
            <Button
              variant={isFollowed ? "secondary" : "default"}
              size="sm"
              onClick={() => void handleToggleFollow()}
              disabled={pending}
              className="gap-2"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isFollowed ? (
                <UserCheck className="size-4" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {isFollowed ? "Suivi" : "Suivre"}
            </Button>
          ) : (
            <span className="text-muted-foreground text-sm">Ton projet</span>
          )}
          <span className="text-muted-foreground text-sm">
            {count} {count === 1 ? "suiveur" : "suiveurs"}
          </span>
        </div>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {followers.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Aucun suiveur pour l&apos;instant.
        </p>
      ) : (
        <div className="space-y-2">
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-3">
              {followers.map((follower) => (
                <Link
                  key={follower.profileId}
                  href={`/u/${follower.profile.username}`}
                  className="hover:bg-muted/60 flex items-center gap-3 rounded-lg p-2 transition-colors"
                >
                  <Avatar
                    name={follower.profile.displayName}
                    src={follower.profile.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {follower.profile.displayName}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      @{follower.profile.username}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
          {hasNextPage ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => void loadMore()}
              disabled={pending}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Voir plus"}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
