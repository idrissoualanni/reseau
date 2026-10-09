import { requireSession } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { createProfile, getOwnProfile, updateProfile } from "@/lib/profile";
import { toOwnProfileDto } from "@/lib/api/mappers/profile";
import { created, ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { createProfileSchema, updateProfileSchema } from "@/lib/validation/profile";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Reste de la ressource « mon profil » (F03/F10). L'identité vient de la
// session ; aucun identifiant n'est lu dans le corps ou l'URL.
export const GET = withApi(async () => {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) throw new NotFoundError("Profil introuvable.");
  return ok(toOwnProfileDto(profile));
});

export const POST = withApi(async (request: Request) => {
  const blocked = guardMutation(request, "/api/me/profile", APP_URL, 10);
  if (blocked) return blocked;
  const session = await requireSession();
  const input = parseInput(createProfileSchema, await readJson(request));
  const profile = await createProfile(session.user.id, input);
  return created(toOwnProfileDto(profile), "/api/me/profile");
});

export const PATCH = withApi(async (request: Request) => {
  const blocked = guardMutation(request, "/api/me/profile", APP_URL, 20);
  if (blocked) return blocked;
  const session = await requireSession();
  const input = parseInput(updateProfileSchema, await readJson(request));
  const profile = await updateProfile(session.user.id, input);
  return ok(toOwnProfileDto(profile));
});
