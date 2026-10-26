import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests unitaires hors navigateur. L'alias `@/` doit être connu de Vitest
// (Next l'injecte au build, pas Vitest) pour tester les modules qui l'utilisent.
export default defineConfig({
  test: {
    environment: "node",
    // Tests colocalisés dans src/. `tests/` contient les specs E2E Playwright
    // (dépendance non installée) et des intégrations hors périmètre Vitest.
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
