import { listProfilesForAdmin, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { toAdminProfileDto } from "@/lib/api/mappers/admin";
import { ok, withApi } from "@/lib/api/respond";

// Tous les profils (F17) : vue d'administration, lecture seule.
export const GET = withApi(async () => {
  const session = await requireSession();
  const profiles = await listProfilesForAdmin(toAdminContext(session));
  return ok({ items: profiles.map(toAdminProfileDto) });
});
