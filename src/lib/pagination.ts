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

// Curseur de tuple générique (F09) : base64url d'un tableau de valeurs
// (string | number | Date). Les Dates sont ISO ; la validation rejette toute
// entrée mal formée.
export type TupleCursor = (string | number | Date)[];

export function encodeTupleCursor(values: TupleCursor): string {
  const serialized = values.map((value) =>
    value instanceof Date ? { d: value.toISOString() } : value,
  );
  return Buffer.from(JSON.stringify(serialized)).toString("base64url");
}

export function decodeTupleCursor(raw: string): TupleCursor {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    throw new ValidationError("Curseur invalide.");
  }
  if (!Array.isArray(parsed)) throw new ValidationError("Curseur invalide.");
  return parsed.map((value) => {
    if (value instanceof Date) return value;
    if (typeof value === "object" && value !== null && "d" in value) {
      const date = new Date(String((value as { d: unknown }).d));
      if (!Number.isNaN(date.getTime())) return date;
      throw new ValidationError("Curseur invalide.");
    }
    if (typeof value === "string" || typeof value === "number") return value;
    throw new ValidationError("Curseur invalide.");
  });
}
