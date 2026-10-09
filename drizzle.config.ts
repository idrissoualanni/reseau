import { defineConfig } from "drizzle-kit";

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
