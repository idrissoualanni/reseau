import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { reactToMessage, removeMessageReaction } from "@/lib/messaging";
import { toReactionDto } from "@/lib/api/mappers/messaging";
import { noContent, ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { messageReactionSchema } from "@/lib/validation/messaging";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

type RouteContext = { params: Promise<{ id: string }> };

export const PUT = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, "/api/messages/reaction", APP_URL, 60);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const { id } = await context.params;
  const input = parseInput(messageReactionSchema, await readJson(request));
  const reaction = await reactToMessage(
    { userId: session.user.id, profileId: profile.id },
    id,
    input,
  );
  return ok(toReactionDto(reaction));
});

export const DELETE = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, "/api/messages/reaction", APP_URL, 60);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const { id } = await context.params;
  await removeMessageReaction(
    { userId: session.user.id, profileId: profile.id },
    id,
  );
  return noContent();
});
