import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { listPublicSpacesUseCase } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";

export const instant = false;

const TYPE_LABELS: Record<string, string> = {
  university: "Université",
  department: "Filière",
  theme: "Thème",
};

// Liste des espaces publics (F15) : point d'entrée pour découvrir et rejoindre.
// La session (cookies) est lue à chaque requête.
export default async function SpacesPage() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const spaces = await listPublicSpacesUseCase();

  return (
    <PageShell width="feed" className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Espaces</h1>
        <p className="text-muted-foreground text-sm">
          Rejoins l&apos;université, la filière ou le thème qui te correspond.
        </p>
      </div>

      {spaces.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun espace pour l'instant."
          description="Les espaces apparaîtront ici dès qu'un administrateur en créera un."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {spaces.map((space) => (
            <li key={space.id}>
              <Card>
                <CardContent className="flex flex-col gap-2 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/spaces/${space.slug}`}
                      className="text-foreground text-base font-semibold hover:underline"
                    >
                      {space.name}
                    </Link>
                    <Badge variant="secondary">{TYPE_LABELS[space.type] ?? space.type}</Badge>
                    {space.visibility === "private" ? (
                      <Badge variant="outline">Privé</Badge>
                    ) : null}
                  </div>
                  {space.description ? (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {space.description}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
