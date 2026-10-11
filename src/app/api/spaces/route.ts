import { requireSession } from "@/lib/auth";
import { listPublicSpacesUseCase } from "@/lib/admin";
import { toSpaceDto } from "@/lib/api/mappers/admin";
import { ok, withApi } from "@/lib/api/respond";

// Liste des espaces publics (F14). Réservée aux utilisateurs connectés.
export const GET = withApi(async () => {
  await requireSession();
  const spaces = await listPublicSpacesUseCase();
  return ok({ items: spaces.map((space) => toSpaceDto(space)) });
});
