import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, ValidationError, type ErrorCode } from "@/lib/errors";

// Format d'erreur unique de l'API REST (api-rest §8) : jamais de détail
// technique, `fields` seulement pour VALIDATION / RULE_VIOLATION.
const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RULE_VIOLATION: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export function ok<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 200 });
}

export function created<T>(data: T, location?: string): NextResponse {
  const response = NextResponse.json(data, { status: 201 });
  if (location) response.headers.set("Location", location);
  return response;
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// Lecture du corps JSON : un corps illisible est une entrée invalide (400),
// pas une erreur serveur.
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Corps JSON invalide.");
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    const body: { error: { code: ErrorCode; message: string; fields?: Record<string, string> } } = {
      error: { code: error.code, message: error.message },
    };
    if (error.fields) body.error.fields = error.fields;
    return NextResponse.json(body, { status: STATUS[error.code] });
  }
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Une erreur est survenue." } },
    { status: 500 },
  );
}

// Convertit un échec Zod en ValidationError portant le détail par champ,
// pour que le handler n'ait jamais à formater d'erreur lui-même.
export function parseInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "form";
      fields[key] ??= issue.message;
    }
    throw new ValidationError("Certains champs sont invalides.", fields);
  }
  return result.data;
}

// Enveloppe commune : attrape toute exception et la convertit au format unique.
export function withApi<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
