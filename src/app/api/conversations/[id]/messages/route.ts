import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { listConversationMessages, sendMessage } from "@/lib/messaging";
import { toMessageDto, toReactionDto } from "@/lib/api/mappers/messaging";
import { created, ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { listMessagesQuerySchema, sendMessageSchema } from "@/lib/validation/messaging";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApi(async (request: Request, context: RouteContext) => {
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const { id } = await context.params;
  const url = new URL(request.url);
  const query = parseInput(listMessagesQuerySchema, {
    first: url.searchParams.get("first") ?? undefined,
    after: url.searchParams.get("after") ?? undefined,
  });
  const result = await listConversationMessages(
    { userId: session.user.id, profileId: profile.id },
    id,
    query.first,
    query.after,
  );
  return ok({
    items: result.items.map((item) => ({
      ...toMessageDto(item.message),
      reactions: item.reactions.map(toReactionDto),
    })),
    nextCursor: result.nextCursor,
  });
});

export const POST = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, "/api/conversations/messages", APP_URL, 60);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const { id } = await context.params;
  const input = parseInput(sendMessageSchema, await readJson(request));
  const message = await sendMessage(
    { userId: session.user.id, profileId: profile.id },
    id,
    input,
  );
  return created(toMessageDto(message), `/api/messages/${message.id}`);
});
