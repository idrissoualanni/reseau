import { getSession } from "@/lib/auth";
import { findProfileByUserId } from "@/lib/repositories/profiles";
import type { GraphQLContext } from "./builder";
import { createLoaders } from "./loaders";

// Contexte GraphQL : session (cookie Neon Auth) → { userId, profileId, loaders }.
// `profileId` est chargé ici, une seule fois par requête.
export async function buildGraphQLContext(): Promise<GraphQLContext> {
  const session = await getSession();
  const userId = session?.user?.id ?? null;

  let profileId: string | null = null;
  if (userId) {
    const profile = await findProfileByUserId(userId);
    profileId = profile?.id ?? null;
  }

  return { userId, profileId, loaders: createLoaders() };
}
