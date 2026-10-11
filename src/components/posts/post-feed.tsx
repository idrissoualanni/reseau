"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/posts/post-card";
import { loadPostsPage } from "@/lib/actions/posts";
import { groupPostsByDay } from "@/lib/posts-grouping";
import type { PostFeedPage } from "@/lib/posts-feed";

// Fil de posts paginé (F11) : cartes regroupées par jour. `nowIso` vient du
// serveur pour que le libellé des groupes soit identique au rendu serveur.
export function PostFeed({
  initialPage,
  nowIso,
}: {
  initialPage: PostFeedPage;
  nowIso: string;
}) {
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

  const groups = groupPostsByDay(page.edges, nowIso);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label} className="space-y-3">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {group.label}
          </h2>
          <div className="space-y-4">
            {group.items.map((edge) => (
              <PostCard key={edge.cursor} post={edge.post} author={edge.author} />
            ))}
          </div>
        </section>
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
