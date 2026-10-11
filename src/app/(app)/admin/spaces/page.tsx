import Link from "next/link";
import { Plus } from "lucide-react";
import { listSpacesForAdmin, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { archiveSpaceAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ActionButton } from "@/components/admin/action-button";
import { formatDate } from "@/components/admin/format";

export const instant = false;

const TYPE_LABELS: Record<string, string> = {
  university: "Université",
  department: "Filière",
  theme: "Thème",
};

// Liste des espaces (F14/F17), archivés compris.
export default async function AdminSpacesPage() {
  const session = await requireSession();
  const spaces = await listSpacesForAdmin(toAdminContext(session));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          {spaces.length} espace{spaces.length > 1 ? "s" : ""}
        </p>
        <Button asChild>
          <Link href="/admin/spaces/new">
            <Plus aria-hidden />
            Nouvel espace
          </Link>
        </Button>
      </div>

      {spaces.length === 0 ? (
        <EmptyState
          title="Aucun espace"
          description="Crée le premier espace pour regrouper des membres autour d'un thème."
        />
      ) : (
        <ul className="divide-border divide-y rounded-lg border">
          {spaces.map(({ space, memberCount }) => (
            <li key={space.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/spaces/${space.id}`}
                    className="text-foreground font-medium hover:underline"
                  >
                    {space.name}
                  </Link>
                  <Badge variant="secondary">{TYPE_LABELS[space.type] ?? space.type}</Badge>
                  <Badge variant={space.visibility === "public" ? "success" : "outline"}>
                    {space.visibility === "public" ? "Public" : "Privé"}
                  </Badge>
                  {space.archivedAt ? <Badge variant="destructive">Archivé</Badge> : null}
                </div>
                <p className="text-muted-foreground mt-1 truncate text-sm">
                  /{space.slug} · {memberCount} membre{memberCount > 1 ? "s" : ""} · créé le{" "}
                  {formatDate(space.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/spaces/${space.id}`}>Modifier</Link>
                </Button>
                {!space.archivedAt ? (
                  <ActionButton
                    action={archiveSpaceAction}
                    fields={{ id: space.id }}
                    label="Archiver"
                    pendingLabel="Archivage…"
                    variant="destructive"
                    confirm={`Archiver « ${space.name} » ? L'espace ne sera plus visible.`}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
