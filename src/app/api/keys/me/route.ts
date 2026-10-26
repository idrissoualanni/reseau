import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { getOwnKey, publishOwnKey } from "@/lib/messaging";
import { toProfileKeyDto } from "@/lib/api/mappers/messaging";
import { created, ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { publishProfileKeySchema } from "@/lib/validation/messaging";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export const GET = withApi(async () => {
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const key = await getOwnKey({ userId: session.user.id, profileId: profile.id });
  return ok({ key: key ? toProfileKeyDto(key) : null });
});

export const POST = withApi(async (request: Request) => {
  const blocked = guardMutation(request, "/api/keys/me", APP_URL, 10);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const existing = await getOwnKey({ userId: session.user.id, profileId: profile.id });
  const input = parseInput(publishProfileKeySchema, await readJson(request));
  const key = await publishOwnKey({ userId: session.user.id, profileId: profile.id }, input);
  return existing ? ok(toProfileKeyDto(key)) : created(toProfileKeyDto(key), "/api/keys/me");
});
