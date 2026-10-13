import { toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { toSpaceAccessMethodDto } from "@/lib/api/mappers/admin";
import { ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { configureAccessMethod, getSpaceAccessMethods } from "@/lib/spaces";
import { setAccessMethodSchema, spaceAccessKindSchema } from "@/lib/validation/space";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const ROUTE = "/api/admin/spaces/[id]/access-methods";

type RouteContext = { params: Promise<{ id: string }> };

// Méthodes d'accès configurées sur un espace (F15/F17). Jamais de `config` en sortie.
export const GET = withApi(async (_request: Request, context: RouteContext) => {
  const session = await requireSession();
  const { id } = await context.params;
  const methods = await getSpaceAccessMethods(toAdminContext(session), id);
  return ok({ items: methods.map(toSpaceAccessMethodDto) });
});

// Configure une méthode d'accès. `method` vient de la query (?method=invite_code),
// le corps décrit l'activation et, le cas échéant, le code/la régénération.
// Le secret éventuel n'est renvoyé qu'une seule fois, à la génération.
export const PUT = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, ROUTE, APP_URL, 30);
  if (blocked) return blocked;

  const session = await requireSession();
  const { id } = await context.params;
  const method = parseInput(
    spaceAccessKindSchema,
    new URL(request.url).searchParams.get("method"),
  );
  const input = parseInput(setAccessMethodSchema, await readJson(request));
  const result = await configureAccessMethod(toAdminContext(session), id, method, input);

  return ok({
    method: toSpaceAccessMethodDto(result.method),
    ...(result.secret === undefined ? {} : { secret: result.secret }),
  });
});
