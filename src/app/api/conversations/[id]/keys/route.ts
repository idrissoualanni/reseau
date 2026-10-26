import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { getConversationKeyBundle, saveConversationKeys } from "@/lib/messaging";
import { toConversationKeyDto } from "@/lib/api/mappers/messaging";
import { ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { saveConversationKeysSchema } from "@/lib/validation/messaging";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApi(async (_request: Request, context: RouteContext) => {
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const { id } = await context.params;
  const bundle = await getConversationKeyBundle(
    { userId: session.user.id, profileId: profile.id },
    id,
  );
  return ok({
    participantKeys: bundle.participantKeys,
    wrappedKeys: bundle.wrappedKeys.map(toConversationKeyDto),
  });
});

export const POST = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, "/api/conversations/keys", APP_URL, 30);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const { id } = await context.params;
  const input = parseInput(saveConversationKeysSchema, await readJson(request));
  const keys = await saveConversationKeys(
    { userId: session.user.id, profileId: profile.id },
    id,
    input.keys,
  );
  return ok({ items: keys.map(toConversationKeyDto) });
});
