import { listProjectsForAdmin, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { toAdminProjectDto } from "@/lib/api/mappers/admin";
import { ok, withApi } from "@/lib/api/respond";

// Tous les projets (F17), brouillons inclus : vue d'administration, lecture seule.
export const GET = withApi(async () => {
  const session = await requireSession();
  const projects = await listProjectsForAdmin(toAdminContext(session));
  return ok({ items: projects.map(toAdminProjectDto) });
});
