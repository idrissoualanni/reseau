import { ValidationError } from "@/lib/errors";

// Curseur opaque base64url d'un couple de tri `(date, id)`. La pagination se
// fait toujours par comparaison de tuple, jamais par OFFSET (F07 règle 3).
export type Cursor = { sortAt: Date; id: string };

export function encodeCursor({ sortAt, id }: Cursor): string {
  return Buffer.from(JSON.stringify({ t: sortAt.toISOString(), id })).toString("base64url");
}

export function decodeCursor(raw: string): Cursor {
  let parsed: { t?: unknown; id?: unknown };
  try {
    parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    throw new ValidationError("Curseur invalide.");
  }
  const sortAt = typeof parsed.t === "string" ? new Date(parsed.t) : new Date(Number.NaN);
  if (typeof parsed.id !== "string" || parsed.id.length === 0 || Number.isNaN(sortAt.getTime())) {
    throw new ValidationError("Curseur invalide.");
  }
  return { sortAt, id: parsed.id };
}
