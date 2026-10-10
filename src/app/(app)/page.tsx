import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { loadProjectsFeed } from "@/lib/feed";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectFeed } from "@/components/projects/project-feed";
import { EmptyState } from "@/components/empty-state";
import { Sparkles } from "lucide-react";
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
        <Button asChild>
          <Link href="/me/projects/new">Créer un projet</Link>
        </Button>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="w-full max-w-xs space-y-1.5">
          <Label htmlFor="skill">Filtrer par compétence</Label>
          <Input
            id="skill"
            name="skill"
            placeholder="ex. react"
            defaultValue={skillSlug ?? ""}
            autoComplete="off"
          />
        </div>
        <Button type="submit">Filtrer</Button>
        {skillSlug ? (
          <Button type="button" variant="ghost" asChild>
            <Link href="/">Réinitialiser</Link>
          </Button>
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