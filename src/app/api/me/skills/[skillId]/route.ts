import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { removeOwnSkill } from "@/lib/skills";
import { noContent, withApi } from "@/lib/api/respond";

// Retrait d'une compétence. DELETE idempotent : 204 même si le lien n'existe
// pas. La requête filtre sur le profil de la session, donc un autre membre ne
// peut pas retirer la compétence d'autrui.
export const DELETE = withApi(
  async (_request: Request, context: { params: Promise<{ skillId: string }> }) => {
    const session = await requireSession();
    const profile = await requireOwnProfile(session.user.id);
    const { skillId } = await context.params;
    await removeOwnSkill(profile.id, skillId);
    return noContent();
  },
);
