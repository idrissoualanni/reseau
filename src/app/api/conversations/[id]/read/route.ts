import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { markConversationRead } from "@/lib/messaging";
import { ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { markConversationReadSchema } from "@/lib/validation/messaging";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, "/api/conversations/read", APP_URL, 120);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const { id } = await context.params;
  parseInput(markConversationReadSchema, await readJson(request).catch(() => ({})));
  const result = await markConversationRead(
    { userId: session.user.id, profileId: profile.id },
    id,
  );
  return ok(result);
});
