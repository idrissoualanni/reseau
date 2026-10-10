"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SkillBadge } from "@/components/skill-badge";
import type { StudentResult } from "@/lib/search";

type SearchResultsProps = {
  initialItems: StudentResult[];
  initialNextCursor: string | null;
  skill: string;
};

// Résultats de recherche (F09) : liste paginée par curseur tuple. « Voir plus »
// interroge l'API REST et ajoute la page suivante sans recharger.
export function SearchResults({ initialItems, initialNextCursor, skill }: SearchResultsProps) {
  const [items, setItems] = useState<StudentResult[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    if (pending || !nextCursor) return;
    startTransition(async () => {
      const response = await fetch(
        `/api/search/students?skill=${encodeURIComponent(skill)}&cursor=${encodeURIComponent(nextCursor)}`,
      );
      if (!response.ok) return;
      const data = (await response.json()) as {
        items: StudentResult[];
        nextCursor: string | null;
      };
      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <Card>
              <CardContent className="space-y-3 p-4">
                <Link
                  href={`/u/${item.username}`}
                  className="hover:underline focus-visible:ring-ring inline-flex items-center gap-3 rounded-sm outline-none focus-visible:ring-2"
                >
                  <Avatar name={item.displayName} src={null} />
                  <div>
                    <p className="font-medium">{item.displayName}</p>
                    <p className="text-muted-foreground text-sm">@{item.username}</p>
                  </div>
                </Link>

                {item.schoolName || item.fieldOfStudy ? (
                  <p className="text-muted-foreground text-sm">
                    {[item.schoolName, item.fieldOfStudy].filter(Boolean).join(" · ")}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-1.5">
                  <SkillBadge skill={{ id: skill, slug: skill, name: skill, proofLevel: item.proofLevel }} />
                  <span className="text-muted-foreground text-xs">
                    {item.projectCount} projet{item.projectCount > 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {nextCursor ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={pending}>
            {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
            Voir plus
          </Button>
        </div>
      ) : null}
    </div>
  );
}