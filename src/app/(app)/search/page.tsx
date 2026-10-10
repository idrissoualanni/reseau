import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { searchStudents } from "@/lib/search";
import { PageShell } from "@/components/page-shell";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResults } from "@/components/search/search-results";
import { EmptyState } from "@/components/empty-state";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Recherche d'étudiants par compétence (F09) : accessible aux membres connectés.
// L'état est partagé dans l'URL (`?skill=react`) pour un parcours repérable.
// La session (cookies) est lue à chaque requête : route bloquante.
export const instant = false;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const { skill } = await searchParams;
  const query = skill?.trim() ?? "";

  if (query.length === 0) {
    return (
      <PageShell width="feed" className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Recherche</h1>
          <p className="text-muted-foreground text-sm">
            Trouve les étudiants qui maîtrisent une compétence.
          </p>
        </div>
        <SearchBar />
        <EmptyState
          icon={SearchX}
          title="Recherche une compétence"
          description="Saisis une compétence (ex. React) pour trouver les étudiants qui la maîtrisent."
        />
      </PageShell>
    );
  }

  const result = await searchStudents(
    { userId: session.user.id, profileId: profile.id },
    { skill: query, limit: 20 },
  );

  return (
    <PageShell width="feed" className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Recherche</h1>
        <p className="text-muted-foreground text-sm">
          {result.skill
            ? `Résultats pour « ${result.skill.name} », triés par force de preuve.`
            : "Compétence inconnue : essaie une suggestion ci-dessous."}
        </p>
      </div>

      <SearchBar initial={query} />

      {result.items.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={SearchX}
            title="Aucun résultat pour cette compétence."
            description="Essaye une compétence proche :"
          />
          {result.suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {result.suggestions.map((suggestion) => (
                <Button key={suggestion.id} variant="outline" asChild>
                  <Link href={`/search?skill=${encodeURIComponent(suggestion.slug)}`}>
                    {suggestion.name}
                  </Link>
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <SearchResults
          initialItems={result.items}
          initialNextCursor={result.nextCursor}
          skill={result.skill?.slug ?? query}
        />
      )}
    </PageShell>
  );
}