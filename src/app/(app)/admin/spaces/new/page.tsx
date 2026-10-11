import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SpaceForm } from "@/components/admin/space-form";

// Création d'un espace (F14).
export default function NewSpacePage() {
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
          <SpaceForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
