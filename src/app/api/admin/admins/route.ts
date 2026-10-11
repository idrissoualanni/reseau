import {
  grantPlatformAdmin,
  listPlatformAdminsUseCase,
  toAdminContext,
} from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { toPlatformAdminDto } from "@/lib/api/mappers/admin";
import { created, ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { grantPlatformAdminSchema } from "@/lib/validation/space";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Admins plateforme (F16) : liste et nomination.
export const GET = withApi(async () => {
  const session = await requireSession();
  const admins = await listPlatformAdminsUseCase(toAdminContext(session));
  return ok({ items: admins.map(toPlatformAdminDto) });
});

export const POST = withApi(async (request: Request) => {
  const blocked = guardMutation(request, "/api/admin/admins", APP_URL, 20);
  if (blocked) return blocked;
  const session = await requireSession();
  const input = parseInput(grantPlatformAdminSchema, await readJson(request));
  await grantPlatformAdmin(toAdminContext(session), input.profileId);
  return created({ profileId: input.profileId });
});
