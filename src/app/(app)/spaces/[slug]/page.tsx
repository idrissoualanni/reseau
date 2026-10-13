import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { getPublicSpaceDetail, getPublicSpaceMembers } from "@/lib/spaces";
import type { SpaceAccessKind } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { JoinSpaceForm } from "@/components/spaces/join-space-form";
import { SpaceMemberList } from "@/components/spaces/space-member-list";

export const instant = false;

const TYPE_LABELS: Record<string, string> = {
  university: "Université",
  department: "Filière",
  theme: "Thème",
};

const METHOD_LABELS: Record<SpaceAccessKind, string> = {
  open: "Accès libre",
  invite_code: "Code d'invitation",
  invite_link: "Lien d'invitation",
  manual_approval: "Approbation d'un responsable",
};

// Détail d'un espace public (F15) : informations, méthodes d'accès, adhésion et
// membres vérifiés. Un espace privé ou archivé renvoie 404 (aucune fuite).
export default async function SpaceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const { slug } = await params;
  const { invite } = await searchParams;

  const detail = await getPublicSpaceDetail(slug, { profileId: profile.id }).catch(() => null);
  if (!detail) notFound();

  const { space, accessMethods, memberCount, membership } = detail;
  const members = await getPublicSpaceMembers(slug);
  const activeMethods = accessMethods.map((entry) => entry.method);

  return (
    <PageShell width="feed" className="space-y-6">
      <Link
        href="/spaces"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Espaces
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{space.name}</h1>
          <Badge variant="secondary">{TYPE_LABELS[space.type] ?? space.type}</Badge>
          {space.visibility === "private" ? <Badge variant="outline">Privé</Badge> : null}
        </div>
        {space.description ? (
          <p className="text-muted-foreground text-sm">{space.description}</p>
        ) : null}
        <p className="text-muted-foreground inline-flex items-center gap-1 text-sm">
          <Users aria-hidden className="size-4" />
          {memberCount} membre{memberCount > 1 ? "s" : ""}
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-4 py-4">
          <h2 className="text-base font-semibold">Rejoindre l&apos;espace</h2>

          {membership ? (
            <div className="flex flex-col gap-1">
              {membership.verificationLevel === "verified" ? (
                <Badge variant="success">Membre</Badge>
              ) : membership.verifiedVia === "manual_approval" ? (
                <Badge variant="outline">Demande en attente</Badge>
              ) : (
                <Badge variant="secondary">Membre (non vérifié)</Badge>
              )}
              {membership.verifiedVia === "manual_approval" &&
              membership.verificationLevel === "unverified" ? (
                <p className="text-muted-foreground text-sm">
                  Ta demande sera examinée par un responsable de l&apos;espace.
                </p>
              ) : null}
            </div>
          ) : activeMethods.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Cet espace n&apos;accepte pas encore de nouveaux membres.
            </p>
          ) : (
            <JoinSpaceForm slug={slug} methods={activeMethods} inviteToken={invite} />
          )}

          {activeMethods.length > 0 ? (
            <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
              {activeMethods.map((method) => (
                <Badge key={method} variant="outline">
                  {METHOD_LABELS[method]}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Membres</h2>
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun membre vérifié"
            description="Les membres apparaîtront ici après vérification de leur appartenance."
          />
        ) : (
          <SpaceMemberList members={members} />
        )}
      </section>
    </PageShell>
  );
}
