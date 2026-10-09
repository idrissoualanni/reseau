import { requireSession } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { getPublicProfile } from "@/lib/profile";
import { toPublicProfileDto } from "@/lib/api/mappers/profile";
import { toProfileSkillDto } from "@/lib/api/mappers/skills";
import { ok, withApi } from "@/lib/api/respond";

// Profil public (F08) : identité + compétences, sans e-mail ni identifiant
// interne. Le mapping public garantit l'absence de champ privé.
export const GET = withApi(
  async (_request: Request, context: { params: Promise<{ username: string }> }) => {
    await requireSession();
    const { username } = await context.params;
    const result = await getPublicProfile(username);
    if (!result) throw new NotFoundError("Profil introuvable.");
    return ok({
      profile: toPublicProfileDto(result.profile),
      skills: result.skills.map(toProfileSkillDto),
    });
  },
);