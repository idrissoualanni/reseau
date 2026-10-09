import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

export type Database = NeonDatabase<typeof schema>;

// Singleton paresseux : le pool n'est créé qu'au premier usage réel de `db`,
// pour ne pas ouvrir de connexion à l'import du module.
let pool: Pool | undefined;
let client: Database | undefined;

function getClient(): Database {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL est requis (URL poolée) pour se connecter à la base.");
    }
    pool = new Pool({ connectionString });
    client = drizzle(pool, { schema });
  }
  return client;
}

export const db: Database = new Proxy({} as Database, {
  get(_target, property) {
    return Reflect.get(getClient(), property);
  },
  has(_target, property) {
    return Reflect.has(getClient(), property);
  },
});
