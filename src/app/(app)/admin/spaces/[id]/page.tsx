import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSpaceForAdmin, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { SpaceForm } from "@/components/admin/space-form";

export const instant = false;

// Édition d'un espace (F14). Un identifiant inconnu renvoie 404.
export default async function EditSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const space = await getSpaceForAdmin(toAdminContext(session), id).catch(() => null);
  if (!space) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <Link
        href="/admin/spaces"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Espaces
      </Link>
      <Card>
        <CardContent>
          <SpaceForm
            mode="edit"
            space={{
              id: space.id,
              slug: space.slug,
              name: space.name,
              description: space.description,
              type: space.type,
              visibility: space.visibility,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
