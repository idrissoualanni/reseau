import { listPostsForAdmin, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { toAdminPostDto } from "@/lib/api/mappers/admin";
import { ok, withApi } from "@/lib/api/respond";

// Tous les posts (F17) : vue d'administration, lecture seule.
export const GET = withApi(async () => {
  const session = await requireSession();
  const posts = await listPostsForAdmin(toAdminContext(session));
  return ok({ items: posts.map(toAdminPostDto) });
});
