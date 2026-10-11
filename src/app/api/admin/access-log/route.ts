import { z } from "zod";
import { listAccessLogForAdmin, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { toAccessLogDto } from "@/lib/api/mappers/admin";
import { ok, parseInput, withApi } from "@/lib/api/respond";

// Journal d'accès (F17), lecture seule. Filtre optionnel par espace.
const accessLogQuerySchema = z.object({ space: z.uuid("Espace invalide.").optional() });

export const GET = withApi(async (request: Request) => {
  const session = await requireSession();
  const url = new URL(request.url);
  const { space } = parseInput(accessLogQuerySchema, {
    space: url.searchParams.get("space") ?? undefined,
  });
  const entries = await listAccessLogForAdmin(toAdminContext(session), space);
  return ok({ items: entries.map(toAccessLogDto) });
});
