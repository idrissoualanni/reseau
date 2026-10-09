import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn (src/lib/utils.ts)", () => {
  it("fusionne les classes conditionnelles en ignorant les fausses", () => {
    expect(cn("p-2", false && "hidden", "text-sm")).toBe("p-2 text-sm");
  });

  it("dédoublonne les classes Tailwind conflictuelles (la dernière gagne)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
