import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { schema } from "./schema";

// printSchema chargé via require : Pothos résout `graphql` en CJS (paquet
// externe), un `import` ESM prendrait l'autre copie du double build graphql
// et lèverait "another module or realm". Une seule instance, comme le schéma.
const require = createRequire(import.meta.url);
const { printSchema } = require("graphql") as typeof import("graphql");

// Golden file (api-graphql §1/§14) : le schema.graphql committé doit être
// identique au schéma exécutable. `npm run graphql:export` écrit le fichier ;
// `npm run graphql:check` (CI) le compare.
const schemaPath = join(process.cwd(), "schema.graphql");
const generated = `${printSchema(schema)}\n`;

describe("schema.graphql", () => {
  it("est synchronisé avec le schéma exécutable", () => {
    if (process.env.UPDATE_SCHEMA === "1") {
      writeFileSync(schemaPath, generated);
    } else {
      expect(existsSync(schemaPath)).toBe(true);
      expect(readFileSync(schemaPath, "utf8")).toBe(generated);
    }
  });
});