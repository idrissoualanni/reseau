// Contexte des cas d'usage. L'identité vient toujours de la session serveur :
// jamais d'un argument reçu du client (architecture §6, security §7).
export type AuthContext = { userId: string };
export type UseCaseContext = { userId: string; profileId: string };

// Lecteur éventuellement anonyme : seules les lectures publiques l'acceptent.
export type ViewerContext = { userId: string | null; profileId: string | null };
