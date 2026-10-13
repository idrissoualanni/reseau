import { requireSession } from "@/lib/auth";
import { findProfileByUserId } from "@/lib/repositories/profiles";
import { getPublicSpaceDetail } from "@/lib/spaces";
import { toSpaceDetailDto } from "@/lib/api/mappers/space";
import { ok, withApi } from "@/lib/api/respond";

// Détail d'un espace public (F14/F15) : informations, méthodes d'accès actives
// et appartenance du lecteur. Un espace privé ou archivé renvoie 404 (aucune
// fuite d'existence, security.md).
export const GET = withApi(
  async (_request: Request, context: { params: Promise<{ slug: string }> }) => {
    const session = await requireSession();
    const { slug } = await context.params;
    const profile = await findProfileByUserId(session.user.id);
    const detail = await getPublicSpaceDetail(
      slug,
      profile ? { profileId: profile.id } : undefined,
    );
    return ok(
      toSpaceDetailDto(detail.space, detail.memberCount, detail.accessMethods, detail.membership),
    );
  },
);
