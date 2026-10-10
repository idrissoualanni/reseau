import { requireSession } from "@/lib/auth";
import { searchStudents } from "@/lib/search";
import { toSkillDto } from "@/lib/api/mappers/skills";
import { ok, parseInput, withApi } from "@/lib/api/respond";
import { z } from "zod";

// Recherche d'étudiants par compétence (F09). REST : une ressource à la fois.
// `skill` est un slug normalisé côté cas d'usage ; `cursor` est opaque (tuple
// de tri). Aucune donnée privée dans la réponse (le mapper ne projette que des
// champs publics).
const searchStudentsQuerySchema = z.object({
  skill: z.string().trim().min(1, "Compétence requise.").max(40, "Recherche trop longue."),
  cursor: z.string().max(200, "Curseur invalide.").optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET = withApi(async (request: Request) => {
  await requireSession();
  const url = new URL(request.url);
  const input = parseInput(searchStudentsQuerySchema, {
    skill: url.searchParams.get("skill") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  const result = await searchStudents(
    { userId: null, profileId: null },
    { skill: input.skill, limit: input.limit, cursor: input.cursor },
  );

  return ok({
    items: result.items,
    nextCursor: result.nextCursor,
    suggestions: result.suggestions.map(toSkillDto),
    skill: result.skill ? toSkillDto(result.skill) : null,
  });
});