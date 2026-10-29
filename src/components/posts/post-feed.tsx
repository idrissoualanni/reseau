"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/posts/post-card";
import { loadPostsPage } from "@/lib/actions/posts";
import type { PostFeedPage } from "@/lib/posts-feed";

// Fil de posts paginé (F11) : cartes en flux continu, sans séparateur de jour.
export function PostFeed({ initialPage }: { initialPage: PostFeedPage }) {
  const [page, setPage] = useState<PostFeedPage>(initialPage);
  const [pending, startTransition] = useTransition();

  function handleMore() {
    if (pending || !page.hasNextPage || !page.endCursor) return;
    startTransition(async () => {
      const next = await loadPostsPage({ after: page.endCursor ?? undefined });
      setPage((prev) => ({
        edges: [...prev.edges, ...next.edges],
        hasNextPage: next.hasNextPage,
        endCursor: next.endCursor,
      }));
    });
  }

  return (
    <div className="space-y-6">
      {page.edges.map((edge) => (
        <PostCard
          key={edge.cursor}
          post={edge.post}
          author={edge.author}
          comments={edge.comments}
        />
      ))}

      {page.hasNextPage ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleMore} disabled={pending}>
            {pending ? "Chargement..." : "Voir plus"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
