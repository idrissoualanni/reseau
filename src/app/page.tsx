import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";

// Page provisoire du Lot 0 : elle prouve que le thème, la navigation et les
// composants sont en place. Elle sera remplacée par le fil des projets (F07)
// quand la fiche UX `docs/ux/projects-feed.md` existera.
export default function Home() {
  return (
    <PageShell>
      <h1 className="sr-only">Accueil</h1>
      <EmptyState
        icon={Sparkles}
        title="Bienvenue"
        description="Les fondations sont posées : thème clair et sombre, navigation et composants. Le fil des projets arrive avec la fonctionnalité F07."
      />
    </PageShell>
  );
}
