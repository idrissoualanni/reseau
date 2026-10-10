import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { postImagePrefix, presignPostImageUpload } from "@/lib/storage";
import {
  imageExtension,
  presignPostImageSchema,
} from "@/lib/validation/post";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const PRESIGN_EXPIRES_IN = 900; // 15 min, le temps de PUT depuis le navigateur

// URL présignée d'upload d'une image de post (F12, ADR 0004). Le navigateur
// écrit ensuite directement dans le bucket Neon ; le contenu ne passe jamais
// par cette API. L'identité vient de la session (api-rest §5).
export const POST = withApi(async (request: Request) => {
  const blocked = guardMutation(request, "/api/uploads/presign", APP_URL, 20);
  if (blocked) return blocked;

  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);

  const input = parseInput(presignPostImageSchema, await readJson(request));

  const ext = imageExtension(input.contentType);
  const key = `${postImagePrefix(profile.id)}${randomUUID()}.${ext}`;
  const uploadUrl = await presignPostImageUpload(key, input.contentType, PRESIGN_EXPIRES_IN);

  return ok({ uploadUrl, key, expiresIn: PRESIGN_EXPIRES_IN });
});