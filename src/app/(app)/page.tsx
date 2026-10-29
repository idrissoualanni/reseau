import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { loadProjectsFeed } from "@/lib/feed";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ProjectFeed } from "@/components/projects/project-feed";
import { EmptyState } from "@/components/empty-state";
import { ArrowRight, Plus, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";

// Fil des projets (F07) : page d'accueil accessible aux membres connectés.
// Affiche uniquement les projets publiés (plus récents d'abord). Filtre
// facultatif par compétence via `?skill=`. « Voir plus » côté client.
// La session (cookies) est lue à chaque requête : on autorise explicitement
// une route bloquante plutôt qu'un prerender partiel (cacheComponents).
export const instant = false;
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const { skill } = await searchParams;
  const skillSlug = skill?.trim() || undefined;

  const feed = await loadProjectsFeed(
    { userId: session.user.id, profileId: profile.id },
    { limit: 20, skillSlug },
  );

  return (
    <PageShell width="feed" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projets</h1>
          <p className="text-muted-foreground text-sm">
            Découvre les projets publiés pour repérer des profils inspirants.
          </p>
        </div>
        <Button
          asChild
          size="icon"
          aria-label="Créer un projet"
          title="Créer un projet"
        >
          <Link href="/me/projects/new">
            <Plus aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <form method="get" role="search" className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Label htmlFor="skill" className="sr-only">
            Filtrer par compétence
          </Label>
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="skill"
            name="skill"
            placeholder="Filtrer par compétence (ex. react)"
            defaultValue={skillSlug ?? ""}
            autoComplete="off"
            className="pr-12 pl-9"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="text-muted-foreground absolute top-0 right-0 rounded-l-none"
            aria-label="Filtrer par compétence"
            title="Filtrer"
          >
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
        {skillSlug ? (
          <Badge variant="secondary" className="gap-1 py-1 pr-1 pl-3">
            <span className="text-xs">Compétence : {skillSlug}</span>
            <Link
              href="/"
              aria-label="Retirer le filtre"
              className="hover:bg-background focus-visible:ring-ring rounded-full p-1 outline-none focus-visible:ring-2"
            >
              <X className="size-3" aria-hidden="true" />
            </Link>
          </Badge>
        ) : null}
      </form>

      {feed.edges.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Aucun projet publié"
          description="Crée le premier projet pour prouver ce que tu sais faire."
          action={
            <Button asChild>
              <Link href="/me/projects/new">Créer un projet</Link>
            </Button>
          }
        />
      ) : (
        <ProjectFeed initialPage={feed} skillSlug={skillSlug} />
      )}
    </PageShell>
  );
}