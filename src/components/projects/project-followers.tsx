"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";

type ProjectFollower = {
  projectId: string;
  profileId: string;
  createdAt: string;
  profile: {
    id: string;
    username: string;
    displayName: string;
    avatarKey: string | null;
  };
};

type ProjectFollowersProps = {
  projectId: string;
  initialFollowers?: ProjectFollower[];
  initialCount?: number;
  initialIsFollowed?: boolean;
};

export function ProjectFollowers({ projectId, initialFollowers = [], initialCount = 0, initialIsFollowed = false }: ProjectFollowersProps) {
  const [followers, setFollowers] = useState(initialFollowers);
  const [count, setCount] = useState(initialCount);
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [pending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialFollowers.length < initialCount);

  async function handleFollow() {
    if (pending) return;
    startTransition(() => {
      setIsFollowed(true);
      setCount((c) => c + 1);
    });

    try {
      // TODO: Call GraphQL mutation followProject
      console.log("Follow project:", projectId);
    } catch (error) {
      startTransition(() => {
        setIsFollowed(false);
        setCount((c) => c - 1);
      });
      console.error("Failed to follow:", error);
    }
  }

  async function handleUnfollow() {
    if (pending) return;
    startTransition(() => {
      setIsFollowed(false);
      setCount((c) => c - 1);
    });

    try {
      // TODO: Call GraphQL mutation unfollowProject
      console.log("Unfollow project:", projectId);
    } catch (error) {
      startTransition(() => {
        setIsFollowed(true);
        setCount((c) => c + 1);
      });
      console.error("Failed to unfollow:", error);
    }
  }

  async function loadMore() {
    if (pending || !hasMore) return;
    // TODO: Implement pagination
    console.log("Load more followers");
  }

  return (
    <div className="space-y-4">
      {/* Follow button + count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant={isFollowed ? "secondary" : "default"}
            size="sm"
            onClick={isFollowed ? handleUnfollow : handleFollow}
            disabled={pending}
            className="gap-2"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : isFollowed ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
            {isFollowed ? "Suivi" : "Suivre"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {count} {count === 1 ? "suiveur" : "suiveurs"}
          </span>
        </div>
      </div>

      {/* Followers list */}
      {followers.length === 0 && !isFollowed ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          Aucun suiveur pour l'instant.
        </p>
      ) : (
        <div className="space-y-2">
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {followers.map((follower) => (
                <div key={follower.profileId} className="flex items-center gap-3">
                  <Avatar
                    name={follower.profile.displayName}
                    src={follower.profile.avatarKey}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{follower.profile.displayName}</p>
                    <p className="text-muted-foreground text-xs truncate">@{follower.profile.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          {hasMore && (
            <Button variant="ghost" size="sm" className="w-full" onClick={loadMore} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Voir plus"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}