export const DEFAULT_REDIRECT = "/";

// Anti open-redirect (F02) : seuls les chemins internes sont acceptés.
// Module sans dépendance, importable côté serveur comme côté client.
export function safeNextPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (next.includes("\\")) return fallback;
  return next;
}
