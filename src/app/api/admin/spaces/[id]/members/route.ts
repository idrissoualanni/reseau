import { toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { toSpaceMemberDto } from "@/lib/api/mappers/space";
import { ok, withApi } from "@/lib/api/respond";
import { listSpaceMembersOverview } from "@/lib/spaces";

// Membres d'un espace, demandes en attente listées séparément (F15/F17).
// Réservé aux admins plateforme et aux `space_admin` de l'espace.
export const GET = withApi(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const session = await requireSession();
    const { id } = await context.params;
    const { members, pending } = await listSpaceMembersOverview(toAdminContext(session), id);
    return ok({
      items: members.map(toSpaceMemberDto),
      pending: pending.map(toSpaceMemberDto),
    });
  },
);
