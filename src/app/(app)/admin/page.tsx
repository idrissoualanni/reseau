import { getAdminStats, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";

export const instant = false;

// Vue d'ensemble (F17) : compteurs globaux de la plateforme.
export default async function AdminOverviewPage() {
  const session = await requireSession();
  const stats = await getAdminStats(toAdminContext(session));

  const cards = [
    { label: "Espaces", value: stats.spaces, hint: `${stats.archivedSpaces} archivé(s)` },
    { label: "Profils", value: stats.profiles },
    { label: "Posts", value: stats.posts },
    { label: "Projets", value: stats.projects },
    { label: "Admins plateforme", value: stats.platformAdmins },
    { label: "Événements d'accès", value: stats.accessEvents },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="space-y-1">
            <p className="text-muted-foreground text-sm">{card.label}</p>
            <p className="text-2xl font-semibold tabular-nums">{card.value}</p>
            {card.hint ? <p className="text-muted-foreground text-xs">{card.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
