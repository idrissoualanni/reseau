import { defineConfig } from "drizzle-kit";
import { loadEnvFile } from "node:process";
import { resolve } from "node:path";

// drizzle-kit ne charge pas `.env.local` tout seul (contrairement à Next) :
// on le charge explicitement, sans dépendance. Silencieux si absent.
try {
  loadEnvFile(resolve(process.cwd(), ".env.local"));
} catch {
  // pas de .env.local : les variables viennent de l'environnement (Render, CI)
}

// Application : URL poolée. Migrations : URL directe (règle projet).
// `.env` est laissé au soin de l'outillage ; aucune valeur n'est écrite ici.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});