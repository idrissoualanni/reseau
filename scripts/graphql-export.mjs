// Exporte schema.graphql depuis le schéma Pothos exécutable (api-graphql §1).
// Le test golden écrit le fichier quand UPDATE_SCHEMA=1 ; vitest gère l'alias
// "@/". Cross-platform : env var posée par le parent, jamais dans le script.
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "npx vitest run src/server/graphql/schema-export.test.ts",
  {
    env: { ...process.env, UPDATE_SCHEMA: "1" },
    stdio: "inherit",
    shell: true,
  },
);

process.exit(result.status ?? 1);