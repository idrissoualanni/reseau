import { GraphQLError } from "graphql";
import { z } from "zod";
import {
  AppError,
  UnauthenticatedError,
  ValidationError,
} from "@/lib/errors";
import type { GraphQLContext } from "./builder";

// Conversion unique AppError → GraphQLError (api-graphql §7). Toute erreur
// inattendue est masquée : le client ne voit jamais un détail interne.
export function toGraphQLError(error: unknown): GraphQLError {
  if (error instanceof AppError) {
    return new GraphQLError(error.message, {
      extensions: {
        code: error.code,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    });
  }
  return new GraphQLError("Une erreur est survenue.");
}

// Enveloppe un résolveur : garantit qu'aucune erreur non typée ne fuit.
export async function run<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw toGraphQLError(error);
  }
}

// Validation d'entrée par Zod au début du résolveur (api-graphql §5).
export function validateInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "input";
      fields[key] ??= issue.message;
    }
    throw new ValidationError("Entrée invalide.", fields);
  }
  return parsed.data;
}

// Les mutations exigent un profil : l'identité vient de la session.
export function requireProfile(ctx: GraphQLContext): {
  userId: string;
  profileId: string;
} {
  if (!ctx.userId || !ctx.profileId) {
    throw new UnauthenticatedError();
  }
  return { userId: ctx.userId, profileId: ctx.profileId };
}
