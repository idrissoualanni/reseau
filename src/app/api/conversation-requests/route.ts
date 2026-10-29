import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { listMyContactRequests, requestContact } from "@/lib/messaging";
import {
  toContactRequestDto,
  toContactRequestStateDto,
} from "@/lib/api/mappers/messaging";
import { created, ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { createDirectConversationSchema } from "@/lib/validation/messaging";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export const GET = withApi(async () => {
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const rows = await listMyContactRequests({
    userId: session.user.id,
    profileId: profile.id,
  });
  const items = rows.map((row) => toContactRequestDto(row, profile.id));
  return ok({
    incoming: items.filter((item) => item.direction === "incoming"),
    outgoing: items.filter((item) => item.direction === "outgoing"),
  });
});

export const POST = withApi(async (request: Request) => {
  const blocked = guardMutation(request, "/api/conversation-requests", APP_URL, 10);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const input = parseInput(createDirectConversationSchema, await readJson(request));
  const result = await requestContact(
    { userId: session.user.id, profileId: profile.id },
    input.participantId,
  );
  const dto = toContactRequestStateDto(result.request);
  return result.wasCreated ? created(dto, `/api/conversation-requests/${dto.id}`) : ok(dto);
});
