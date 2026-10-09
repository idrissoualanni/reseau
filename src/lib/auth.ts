import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";
import { getAuthEnv } from "@/lib/env";
import { UnauthenticatedError } from "@/lib/errors";

let instance: NeonAuth | undefined;

// Instance unique créée au premier usage (et non à l'import) : le build ne doit
// pas exiger les secrets ; la première requête d'auth valide la configuration.
export function getAuth(): NeonAuth {
  if (!instance) {
    const env = getAuthEnv();
    instance = createNeonAuth({
      baseUrl: env.NEON_AUTH_BASE_URL,
      cookies: { secret: env.NEON_AUTH_COOKIE_SECRET },
    });
  }
  return instance;
}

export async function getSession() {
  const { data } = await getAuth().getSession();
  return data;
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new UnauthenticatedError();
  }
  return session;
}

// Contexte transmis aux couches métier : l'identité vient TOUJOURS de la
// session serveur, jamais du corps de requête (security.md §7).
export type AuthContext = { userId: string };

export function toAuthContext(session: { user: { id: string } }): AuthContext {
  return { userId: session.user.id };
}
