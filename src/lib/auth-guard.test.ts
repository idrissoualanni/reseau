import { describe, expect, it } from "vitest";
import { isEmailVerified } from "@/lib/auth-guard";

describe("isEmailVerified", () => {
  it("refuse une session explicitement non vérifiée", () => {
    expect(isEmailVerified({ emailVerified: false })).toBe(false);
  });

  it("accepte une session vérifiée", () => {
    expect(isEmailVerified({ emailVerified: true })).toBe(true);
  });

  it("fail-open si le champ est absent (aucun verrouillage)", () => {
    expect(isEmailVerified({})).toBe(true);
  });

  it("fail-open si le champ vaut null", () => {
    expect(isEmailVerified({ emailVerified: null })).toBe(true);
  });
});
