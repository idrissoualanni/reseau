import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { listMyConversations, startDirectConversation } from "@/lib/messaging";
import { toConversationSummaryDto } from "@/lib/api/mappers/messaging";
import { created, ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { createDirectConversationSchema } from "@/lib/validation/messaging";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export const GET = withApi(async () => {
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const conversations = await listMyConversations({ userId: session.user.id, profileId: profile.id });
  return ok({ items: conversations.map(toConversationSummaryDto) });
});

export const POST = withApi(async (request: Request) => {
  const blocked = guardMutation(request, "/api/conversations", APP_URL, 30);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const input = parseInput(createDirectConversationSchema, await readJson(request));
  const result = await startDirectConversation(
    { userId: session.user.id, profileId: profile.id },
    input.participantId,
  );
  const dto = toConversationSummaryDto(result.summary);
  return result.wasCreated ? created(dto, `/api/conversations/${dto.id}`) : ok(dto);
});
