import { checkDatabase } from "@/db/client";

// Sonde de santé consommée par Render (et les vérifications de déploiement).
// Avec `cacheComponents`, un route handler n'est pas mis en cache par défaut.
export async function GET() {
  const database = await checkDatabase();

  return Response.json(
    {
      status: database ? "ok" : "degraded",
      service: "reseau-web",
      database,
      timestamp: new Date().toISOString(),
    },
    { status: database ? 200 : 503 },
  );
}
