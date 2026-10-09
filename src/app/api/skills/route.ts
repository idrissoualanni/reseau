import { requireSession } from "@/lib/auth";
import { searchSkillCatalog } from "@/lib/skills";
import { toSkillDto } from "@/lib/api/mappers/skills";
import { ok, parseInput, withApi } from "@/lib/api/respond";
import { searchSkillsQuerySchema } from "@/lib/validation/skills";

// Autocomplétion du référentiel (F04/F09). Référentiel peu changeant :
// `private, max-age=300` est la seule exception de cache autorisée (api-rest §13).
export const GET = withApi(async (request: Request) => {
  await requireSession();
  const url = new URL(request.url);
  const { q, limit } = parseInput(searchSkillsQuerySchema, {
    q: url.searchParams.get("q") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  const items = await searchSkillCatalog(q, limit);
  const response = ok({ items: items.map(toSkillDto) });
  response.headers.set("Cache-Control", "private, max-age=300");
  return response;
});
