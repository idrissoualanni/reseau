import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { signOutAction } from "@/lib/actions/auth";

// La session (cookies) est lue à chaque requête : on autorise explicitement une
// route bloquante plutôt qu'un prerender partiel (cacheComponents).
export const instant = false;

// Page provisoire du Lot 0 : elle prouve que le thème, la navigation et les
// composants sont en place. Elle sera remplacée par le fil des projets (F07)
// quand la fiche UX `docs/ux/projects-feed.md` existera. Tant que le membre n'a
// pas de profil, il est renvoyé vers l'onboarding (F03 règle 5).
export default async function Home() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  return (
    <PageShell>
      <h1 className="sr-only">Accueil</h1>
      <EmptyState
        icon={Sparkles}
        title="Bienvenue"
        description="Les fondations sont posées : thème clair et sombre, navigation et composants. Le fil des projets arrive avec la fonctionnalité F07."
      />
      <form action={signOutAction} className="mt-6 flex justify-center">
        <Button type="submit" variant="outline">
          Se déconnecter
        </Button>
      </form>
    </PageShell>
  );
}
