import {
  archiveSpace,
  getSpaceForAdmin,
  toAdminContext,
  updateSpace,
} from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { toSpaceDto } from "@/lib/api/mappers/admin";
import { noContent, ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { updateSpaceSchema } from "@/lib/validation/space";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

type RouteContext = { params: Promise<{ id: string }> };

// Espace : lecture, modification, archivage (F14/F17).
export const GET = withApi(async (_request: Request, context: RouteContext) => {
  const session = await requireSession();
  const { id } = await context.params;
  const space = await getSpaceForAdmin(toAdminContext(session), id);
  return ok(toSpaceDto(space));
});

export const PATCH = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, "/api/admin/spaces/[id]", APP_URL, 60);
  if (blocked) return blocked;
  const session = await requireSession();
  const input = parseInput(updateSpaceSchema, await readJson(request));
  const { id } = await context.params;
  const space = await updateSpace(toAdminContext(session), id, input);
  return ok(toSpaceDto(space));
});

export const DELETE = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, "/api/admin/spaces/[id]", APP_URL, 60);
  if (blocked) return blocked;
  const session = await requireSession();
  const { id } = await context.params;
  await archiveSpace(toAdminContext(session), id);
  return noContent();
});
