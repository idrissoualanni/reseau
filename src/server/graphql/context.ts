import { getSession } from "@/lib/auth";
import { isEmailVerified } from "@/lib/auth-guard";
import { findProfileByUserId } from "@/lib/repositories/profiles";
import type { GraphQLContext } from "./builder";
import { createLoaders } from "./loaders";

// Contexte GraphQL : session (cookie Neon Auth) → { userId, profileId, loaders }.
// `profileId` est chargé ici, une seule fois par requête.
export async function buildGraphQLContext(): Promise<GraphQLContext> {
  const session = await getSession();
  // Garde de vérification (F17) : une session non vérifiée est traitée comme anonyme.
  const userId =
    session?.user && isEmailVerified(session.user) ? session.user.id : null;

  let profileId: string | null = null;
  if (userId) {
    const profile = await findProfileByUserId(userId);
    profileId = profile?.id ?? null;
  }

  return { userId, profileId, loaders: createLoaders() };
}
