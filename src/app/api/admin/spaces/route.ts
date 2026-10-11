import { toAdminContext } from "@/lib/admin";
import { createSpace, listSpacesForAdmin } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { toSpaceWithCountDto, toSpaceDto } from "@/lib/api/mappers/admin";
import { created, ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { createSpaceSchema } from "@/lib/validation/space";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Administration des espaces (F14/F17) : réservée aux admins plateforme.
export const GET = withApi(async () => {
  const session = await requireSession();
  const spaces = await listSpacesForAdmin(toAdminContext(session));
  return ok({ items: spaces.map(toSpaceWithCountDto) });
});

export const POST = withApi(async (request: Request) => {
  const blocked = guardMutation(request, "/api/admin/spaces", APP_URL, 30);
  if (blocked) return blocked;
  const session = await requireSession();
  const input = parseInput(createSpaceSchema, await readJson(request));
  const space = await createSpace(toAdminContext(session), input);
  return created(toSpaceDto(space), `/api/admin/spaces/${space.id}`);
});
