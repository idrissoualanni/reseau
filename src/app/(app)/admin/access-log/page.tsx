import { listAccessLogForAdmin, listAllSpacesForAdmin, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/components/admin/format";

export const instant = false;

const ACTION_LABELS: Record<string, string> = {
  join: "Adhésion",
  request: "Demande",
  approve: "Approbation",
  reject: "Refus",
  revoke: "Retrait",
  invite: "Invitation",
};

// Journal d'accès aux espaces (F17), lecture seule, filtrable par espace.
export default async function AdminAccessLogPage({
  searchParams,
}: {
  searchParams: Promise<{ space?: string }>;
}) {
  const session = await requireSession();
  const ctx = toAdminContext(session);
  const { space: spaceParam } = await searchParams;

  const [entries, spaces] = await Promise.all([
    listAccessLogForAdmin(ctx, spaceParam || undefined),
    listAllSpacesForAdmin(ctx),
  ]);

  return (
    <div className="space-y-4">
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Filtrer par espace</span>
          <select
            name="space"
            defaultValue={spaceParam ?? ""}
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          >
            <option value="">Tous les espaces</option>
            {spaces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="outline">
          Filtrer
        </Button>
      </form>

      {entries.length === 0 ? (
        <EmptyState
          title="Aucun événement"
          description="Le journal est vide pour ce filtre."
        />
      ) : (
        <ul className="divide-border divide-y rounded-lg border">
          {entries.map(({ entry, space, profile }) => (
            <li key={entry.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <Badge variant="secondary">{ACTION_LABELS[entry.action] ?? entry.action}</Badge>
              <span className="text-foreground font-medium">{space.name}</span>
              <span className="text-muted-foreground">
                {profile ? `@${profile.username}` : "Profil supprimé"}
              </span>
              <span className="text-muted-foreground ml-auto tabular-nums">
                {formatDateTime(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
