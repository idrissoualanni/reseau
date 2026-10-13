import { requireSession } from "@/lib/auth";
import { toMembershipDto } from "@/lib/api/mappers/space";
import { ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import { ForbiddenError } from "@/lib/errors";
import { findProfileByUserId } from "@/lib/repositories/profiles";
import { joinSpace } from "@/lib/spaces";
import { joinSpaceSchema } from "@/lib/validation/space";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Rejoindre un espace ou demander l'accès (F15). L'identité vient de la session.
export const POST = withApi(
  async (request: Request, context: { params: Promise<{ slug: string }> }) => {
    const blocked = guardMutation(request, "/api/spaces/[slug]/join", APP_URL, 20);
    if (blocked) return blocked;

    const session = await requireSession();
    const profile = await findProfileByUserId(session.user.id);
    if (!profile) {
      throw new ForbiddenError("Complète ton profil avant de rejoindre un espace.");
    }

    const input = parseInput(joinSpaceSchema, await readJson(request));
    const { slug } = await context.params;
    const result = await joinSpace({ profileId: profile.id }, slug, input);
    return ok({ status: result.status, membership: toMembershipDto(result.membership) });
  },
);
