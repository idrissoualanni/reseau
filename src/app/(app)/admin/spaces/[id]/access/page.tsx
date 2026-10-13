import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { getSpaceAccessMethods } from "@/lib/spaces";
import { SPACE_ACCESS_KINDS } from "@/lib/validation/space";
import { Card, CardContent } from "@/components/ui/card";
import { SpaceTabs } from "@/components/admin/space-tabs";
import { AccessMethodForm } from "@/components/admin/access-method-form";

export const instant = false;

const METHOD_LABELS: Record<string, string> = {
  open: "Accès libre",
  invite_code: "Code d'invitation",
  invite_link: "Lien d'invitation",
  manual_approval: "Approbation d'un responsable",
};

const METHOD_DESCRIPTIONS: Record<string, string> = {
  open: "Toute personne connectée peut rejoindre sans vérification.",
  invite_code: "Les membres saisissent un code fourni par l'établissement.",
  invite_link: "Un lien à usage multiple, qui expire au bout de 30 jours.",
  manual_approval: "Chaque demande doit être approuvée par un gestionnaire.",
};

// Méthodes d'accès d'un espace (F15/F17). Réservé aux admins plateforme et aux
// gestionnaires de l'espace (vérifié côté serveur par le cas d'usage).
export default async function SpaceAccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const methods = await getSpaceAccessMethods(toAdminContext(session), id).catch(() => null);
  if (!methods) notFound();

  const byMethod = new Map(methods.map((entry) => [entry.method, entry.isActive]));

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

      <div className="space-y-1">
        <h2 className="text-base font-semibold">Méthodes d&apos;accès</h2>
        <p className="text-muted-foreground text-sm">
          Active les méthodes que cet espace accepte pour rejoindre.
        </p>
      </div>

      <div className="grid gap-4">
        {SPACE_ACCESS_KINDS.map((method) => (
          <Card key={method}>
            <CardContent className="flex flex-col gap-2 py-4">
              <div>
                <h3 className="text-sm font-semibold">{METHOD_LABELS[method]}</h3>
                <p className="text-muted-foreground text-xs">{METHOD_DESCRIPTIONS[method]}</p>
              </div>
              <AccessMethodForm
                spaceId={id}
                method={method}
                isActive={byMethod.get(method) ?? false}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
