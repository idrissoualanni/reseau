import { describe, expect, it } from "vitest";
import { ValidationError } from "@/lib/errors";
import { decodeTupleCursor, encodeTupleCursor } from "@/lib/pagination";

describe("curseur tuple (F09)", () => {
  it("round-trip : valeurs string, number et Date", () => {
    const cursor = [0, 3, new Date("2026-01-01T00:00:00Z"), "p1"] as const;
    const encoded = encodeTupleCursor([...cursor]);
    const decoded = decodeTupleCursor(encoded);

    expect(decoded[0]).toBe(0);
    expect(decoded[1]).toBe(3);
    expect(decoded[2]).toEqual(new Date("2026-01-01T00:00:00Z"));
    expect(decoded[3]).toBe("p1");
  });

  it("rejette un curseur mal forme", () => {
    expect(() => decodeTupleCursor("!!!pas-base64!!!")).toThrow(ValidationError);
    expect(() => decodeTupleCursor("e30")).toThrow(ValidationError); // {} pas un tableau
  });

  it("rejette une valeur de type inattendu dans le tuple", () => {
    const encoded = Buffer.from(JSON.stringify([{ nested: true }])).toString("base64url");
    expect(() => decodeTupleCursor(encoded)).toThrow(ValidationError);
  });
});