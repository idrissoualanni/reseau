import { ConflictError } from "@/lib/errors";

// Le pilote Postgres renvoie le code SQLSTATE 23505 sur violation d'unicité.
// La couche données est la seule à convertir ce détail technique en erreur
// métier (règles architecture §13) : le reste du code ignore Postgres.
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23505";
}

export function toConflict(error: unknown, message: string): never {
  if (isUniqueViolation(error)) {
    throw new ConflictError(message);
  }
  throw error;
}
