import { describe, expect, it } from "vitest";
import { isOnline, isTyping, presenceLabel } from "@/lib/realtime/signals";

const NOW = Date.parse("2026-10-29T12:00:00.000Z");

describe("signaux temps réel", () => {
  it("considère une saisie active pendant 6 s", () => {
    expect(isTyping(new Date(NOW - 5_000).toISOString(), NOW)).toBe(true);
    expect(isTyping(new Date(NOW - 6_000).toISOString(), NOW)).toBe(true);
    expect(isTyping(new Date(NOW - 6_001).toISOString(), NOW)).toBe(false);
  });

  it("ignore les dates absentes ou invalides", () => {
    expect(isTyping(null, NOW)).toBe(false);
    expect(isOnline("pas-une-date", NOW)).toBe(false);
  });

  it("considère un profil en ligne pendant 90 s", () => {
    expect(isOnline(new Date(NOW - 90_000).toISOString(), NOW)).toBe(true);
    expect(isOnline(new Date(NOW - 90_001).toISOString(), NOW)).toBe(false);
  });

  it("libelle la présence", () => {
    expect(presenceLabel(new Date(NOW - 10_000).toISOString(), NOW)).toBe("En ligne");
    expect(presenceLabel(new Date(NOW - 5 * 60_000).toISOString(), NOW)).toBe("Vu il y a 5 min");
    expect(presenceLabel(new Date(NOW - 3 * 3_600_000).toISOString(), NOW)).toBe("Vu il y a 3 h");
    expect(presenceLabel(null, NOW)).toBe("Hors ligne");
  });
});
