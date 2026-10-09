import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests unitaires hors navigateur. L'alias `@/` doit être connu de Vitest
// (Next l'injecte au build, pas Vitest) pour tester les modules qui l'utilisent.
export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
