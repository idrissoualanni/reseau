import { revokePlatformAdmin, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { noContent, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Retrait d'un admin plateforme (F16). Le dernier admin ne peut pas être retiré
// (règle vérifiée côté serveur).
export const DELETE = withApi(
  async (request: Request, context: { params: Promise<{ profileId: string }> }) => {
    const blocked = guardMutation(request, "/api/admin/admins/[profileId]", APP_URL, 20);
    if (blocked) return blocked;
    const session = await requireSession();
    const { profileId } = await context.params;
    await revokePlatformAdmin(toAdminContext(session), profileId);
    return noContent();
  },
);
