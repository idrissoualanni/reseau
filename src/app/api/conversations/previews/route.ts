import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { listConversationPreviewKeys } from "@/lib/messaging";
import { ok, withApi } from "@/lib/api/respond";

// Enveloppes nécessaires au déchiffrement des aperçus de la liste.
// Le serveur ne renvoie que des clés opaques et des clés publiques.
export const GET = withApi(async () => {
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const items = await listConversationPreviewKeys({
    userId: session.user.id,
    profileId: profile.id,
  });
  return ok({ items });
});
