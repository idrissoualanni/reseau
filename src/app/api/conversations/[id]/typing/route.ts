import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { findParticipant, setConversationTyping } from "@/lib/repositories/messaging";
import { NotFoundError } from "@/lib/errors";
import { ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { typingSignalSchema } from "@/lib/validation/messaging";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

type RouteContext = { params: Promise<{ id: string }> };

// Signal éphémère : aucune donnée de contenu, seulement « écrit / n'écrit plus ».
export const POST = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, "/api/conversations/typing", APP_URL, 240);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const { id } = await context.params;
  const input = parseInput(typingSignalSchema, await readJson(request));
  const participant = await findParticipant(id, profile.id);
  if (!participant) throw new NotFoundError("Conversation introuvable.");
  await setConversationTyping(id, profile.id, input.typing);
  return ok({ typing: input.typing });
});
