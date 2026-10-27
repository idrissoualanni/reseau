import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { findParticipant } from "@/lib/repositories/messaging";
import { sealMessagesQuery } from "@/lib/realtime/server";
import { NotFoundError } from "@/lib/errors";
import { ok, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

type RouteContext = { params: Promise<{ id: string }> };

// Le client ne voit qu'une capacité scellée : le SQL et les paramètres restent
// côté serveur. La requête joint l'appartenance, donc elle reste autorisée en direct.
export const POST = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, "/api/conversations/live", APP_URL, 60);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const { id } = await context.params;
  const participant = await findParticipant(id, profile.id);
  if (!participant) throw new NotFoundError("Conversation introuvable.");
  const sealedQuery = await sealMessagesQuery(profile.id, id);
  return ok({ sealedQuery });
});
