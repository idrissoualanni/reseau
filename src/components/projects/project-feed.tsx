"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { loadPublishedProjectsPage } from "@/lib/actions/projects";
import type { FeedPage } from "@/lib/feed";

// Liste paginée du fil (F07) : bouton « Voir plus » client, utilise une action
// serveur pour récupérer la page suivante (curseur opaque). Les cartes
// réutilisent `ProjectCard`, déjà utilisée par F07/F08 (fiches UX).
export function ProjectFeed({
  initialPage,
  skillSlug,
}: {
  initialPage: FeedPage;
  skillSlug?: string;
}) {
  const [page, setPage] = useState<FeedPage>(initialPage);
  const [pending, startTransition] = useTransition();

  function handleMore() {
    if (pending || !page.hasNextPage || !page.endCursor) return;
    startTransition(async () => {
      const next = await loadPublishedProjectsPage({ after: page.endCursor ?? undefined, skillSlug: skillSlug ?? undefined });
      setPage((prev) => ({
        edges: [...prev.edges, ...next.edges],
        hasNextPage: next.hasNextPage,
        endCursor: next.endCursor,
      }));
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {page.edges.map((edge) => (
          <ProjectCard
            key={edge.cursor}
            project={edge.project}
            skills={edge.skills}
            author={edge.author}
          />
        ))}
      </div>

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