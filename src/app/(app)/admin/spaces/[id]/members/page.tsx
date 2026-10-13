import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { listSpaceMembersOverview } from "@/lib/spaces";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { SpaceTabs } from "@/components/admin/space-tabs";
import { MemberRowActions, PendingMemberActions } from "@/components/admin/member-actions";
import { getPublicUrl } from "@/lib/storage";

export const instant = false;

const ROLE_LABELS: Record<string, string> = {
  member: "Membre",
  space_admin: "Gestionnaire",
};

// Membres d'un espace (F17) : demandes en attente à trancher + membres actifs.
// Réservé aux admins plateforme et aux gestionnaires de l'espace (côté serveur).
export default async function SpaceMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const overview = await listSpaceMembersOverview(toAdminContext(session), id).catch(() => null);
  if (!overview) notFound();

  const { members, pending } = overview;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/spaces"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Espaces
      </Link>
      <SpaceTabs spaceId={id} />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          Demandes en attente{pending.length > 0 ? ` (${pending.length})` : ""}
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune demande en attente.</p>
        ) : (
          <ul className="divide-border divide-y rounded-lg border">
            {pending.map(({ membership, profile }) => (
              <li
                key={membership.id}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={profile.displayName}
                    src={profile.avatarKey ? getPublicUrl(profile.avatarKey) : null}
                  />
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">
                      {profile.displayName}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">@{profile.username}</p>
                  </div>
                </div>
                <PendingMemberActions spaceId={id} membershipId={membership.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Membres</h2>
        {members.length === 0 ? (
          <EmptyState
            title="Aucun membre"
            description="Les membres vérifiés de cet espace apparaîtront ici."
          />
        ) : (
          <ul className="divide-border divide-y rounded-lg border">
            {members.map(({ membership, profile }) => (
              <li
                key={membership.id}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={profile.displayName}
                    src={profile.avatarKey ? getPublicUrl(profile.avatarKey) : null}
                  />
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">
                      {profile.displayName}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">@{profile.username}</p>
                  </div>
                  <Badge variant={membership.role === "space_admin" ? "default" : "secondary"}>
                    {ROLE_LABELS[membership.role] ?? membership.role}
                  </Badge>
                </div>
                <MemberRowActions
                  spaceId={id}
                  membershipId={membership.id}
                  role={membership.role}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
