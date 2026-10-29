import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { acceptContactRequest } from "@/lib/messaging";
import { toContactRequestStateDto } from "@/lib/api/mappers/messaging";
import { ok, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, "/api/conversation-requests/accept", APP_URL, 30);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const { id } = await context.params;
  const result = await acceptContactRequest(
    { userId: session.user.id, profileId: profile.id },
    id,
  );
  return ok({
    conversationId: result.summary.conversation.id,
    request: toContactRequestStateDto(result.request),
  });
});
