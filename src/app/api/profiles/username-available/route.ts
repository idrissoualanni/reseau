import { requireSession } from "@/lib/auth";
import { isUsernameAvailable } from "@/lib/profile";
import { ok, parseInput, withApi } from "@/lib/api/respond";
import { usernameQuerySchema } from "@/lib/validation/profile";

// Disponibilité d'un username pour l'onboarding (F03). Réservé aux membres
// connectés (aucune route publique hors /api/health).
export const GET = withApi(async (request: Request) => {
  await requireSession();
  const url = new URL(request.url);
  const { u } = parseInput(usernameQuerySchema, { u: url.searchParams.get("u") ?? "" });
  return ok({ available: await isUsernameAvailable(u) });
});
