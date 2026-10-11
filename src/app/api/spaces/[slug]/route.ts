import { requireSession } from "@/lib/auth";
import { getPublicSpaceBySlug } from "@/lib/admin";
import { toSpaceDto } from "@/lib/api/mappers/admin";
import { ok, withApi } from "@/lib/api/respond";

// Détail d'un espace public (F14). Un espace privé ou archivé renvoie 404
// (aucune fuite d'existence, security.md).
export const GET = withApi(
  async (_request: Request, context: { params: Promise<{ slug: string }> }) => {
    await requireSession();
    const { slug } = await context.params;
    const space = await getPublicSpaceBySlug(slug);
    return ok(toSpaceDto(space));
  },
);
