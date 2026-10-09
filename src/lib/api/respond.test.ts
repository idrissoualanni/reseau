import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ConflictError, UnauthenticatedError, ValidationError } from "@/lib/errors";
import { errorResponse, parseInput, readJson } from "./respond";

describe("parseInput", () => {
  it("renvoie les données validées et transformées", () => {
    const schema = z.object({ name: z.string().trim() });
    expect(parseInput(schema, { name: " Awa " })).toEqual({ name: "Awa" });
  });

  it("lève une ValidationError portant le détail par champ", () => {
    const schema = z.object({ name: z.string().min(2, "Trop court.") });
    try {
      parseInput(schema, { name: "a" });
      expect.unreachable("parseInput aurait dû lancer");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fields).toEqual({ name: "Trop court." });
    }
  });
});

describe("errorResponse", () => {
  it("mappe chaque code d'erreur sur son statut HTTP", async () => {
    const unauthorized = errorResponse(new UnauthenticatedError());
    expect(unauthorized.status).toBe(401);

    const conflict = errorResponse(new ConflictError("déjà pris"));
    expect(conflict.status).toBe(409);
    await expect(conflict.json()).resolves.toMatchObject({
      error: { code: "CONFLICT", message: "déjà pris" },
    });
  });

  it("masque une erreur inconnue derrière un 500 générique", async () => {
    const response = errorResponse(new Error("détail interne à ne pas fuiter"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: { code: "INTERNAL", message: "Une erreur est survenue." },
    });
  });
});

describe("readJson", () => {
  it("lève une ValidationError sur un corps illisible", async () => {
    const request = new Request("http://test.local", { method: "POST", body: "pas du json" });
    await expect(readJson(request)).rejects.toBeInstanceOf(ValidationError);
  });
});
