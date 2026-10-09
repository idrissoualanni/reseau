import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { addOwnSkill, listOwnSkills } from "@/lib/skills";
import { toProfileSkillDto } from "@/lib/api/mappers/skills";
import { created, ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { addSkillSchema } from "@/lib/validation/skills";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Compétences du membre connecté (F04). Liste courte et bornée (max 30) :
// pas de curseur, mais l'enveloppe `{ items }` est conservée (api-rest §9).
export const GET = withApi(async () => {
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const skills = await listOwnSkills(profile.id);
  return ok({ items: skills.map(toProfileSkillDto) });
});

export const POST = withApi(async (request: Request) => {
  const blocked = guardMutation(request, "/api/me/skills", APP_URL, 30);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  const input = parseInput(addSkillSchema, await readJson(request));
  const skill = await addOwnSkill(profile.id, input.name);
  return created(toProfileSkillDto(skill));
});
