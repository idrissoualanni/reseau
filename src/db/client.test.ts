import { describe, expect, it } from "vitest";

describe("client Drizzle (src/db/client.ts)", () => {
  it("crée le pool paresseusement : l'import n'exige pas DATABASE_URL", async () => {
    expect(process.env.DATABASE_URL).toBeUndefined();
    const { db } = await import("./client");
    expect(db).toBeDefined();
  });

  it("lève une erreur claire si DATABASE_URL manque à la première utilisation", async () => {
    expect(process.env.DATABASE_URL).toBeUndefined();
    const { db } = await import("./client");
    expect(() => Reflect.get(db, "select")).toThrowError(/DATABASE_URL est requis/);
  });
});