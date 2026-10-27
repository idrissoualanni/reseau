"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deletePostAndRedirectAction,
  loadOwnPostsPage,
  type OwnPostSummary,
} from "@/lib/actions/posts";

type MyPostsListProps = {
  initialPosts: OwnPostSummary[];
  initialHasNextPage: boolean;
  initialEndCursor: string | null;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function MyPostsList({
  initialPosts,
  initialHasNextPage,
  initialEndCursor,
}: MyPostsListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [endCursor, setEndCursor] = useState(initialEndCursor);
  const [pending, setPending] = useState(false);

  async function loadMore() {
    if (pending || !hasNextPage || !endCursor) return;
    setPending(true);
    const next = await loadOwnPostsPage({ after: endCursor });
    setPending(false);
    setPosts((current) => [
      ...current,
      ...next.posts.filter((post) => !current.some((item) => item.id === post.id)),
    ]);
    setHasNextPage(next.hasNextPage);
    setEndCursor(next.endCursor);
  }

  if (posts.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        Aucun post pour l&apos;instant. Publie ta première activité depuis le fil.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
            {post.imageUrls.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element -- bucket post public_read
              <img
                src={post.imageUrls[0]}
                alt=""
                className="bg-muted h-20 w-full rounded-lg object-cover sm:w-28"
                loading="lazy"
              />
            ) : null}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="line-clamp-3 text-sm whitespace-pre-wrap">{post.body}</p>
              <p className="text-muted-foreground text-xs">
                Publié le {formatDate(post.createdAt)}
                {post.updatedAt !== post.createdAt
                  ? ` · modifié le ${formatDate(post.updatedAt)}`
                  : null}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/posts/${post.id}/edit`}>
                    <Pencil className="size-4" />
                    Modifier
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/posts/${post.id}`}>
                    <ExternalLink className="size-4" />
                    Voir
                  </Link>
                </Button>
                <form
                  action={async (formData) => {
                    await deletePostAndRedirectAction(formData);
                  }}
                  onSubmit={(event) => {
                    if (!window.confirm("Supprimer ce post et ses commentaires ?")) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={post.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    <Trash2 className="text-destructive size-4" />
                    Supprimer
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {hasNextPage ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void loadMore()} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Voir plus
          </Button>
        </div>
      ) : null}
    </div>
  );
}
