import { createYoga, type Plugin } from "graphql-yoga";
import { originAllowed } from "@/lib/api/security";
import { buildGraphQLContext } from "@/server/graphql/context";
import { depthLimitRule } from "@/server/graphql/depth-limit";
import { schema } from "@/server/graphql/schema";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const MAX_DEPTH = 6;

// Yoga unique de l'application (api-graphql §1/§9) : schéma Pothos, contexte
// par requête, GraphiQL en dev seulement, erreurs masquées, profondeur bornée.
const depthLimitPlugin: Plugin = {
  onValidate({ addValidationRule }) {
    addValidationRule(depthLimitRule(MAX_DEPTH));
  },
};

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  graphiql: process.env.NODE_ENV !== "production",
  context: () => buildGraphQLContext(),
  plugins: [depthLimitPlugin],
  maskedErrors: true,
});

function forbidden(): Response {
  return new Response(
    JSON.stringify({ error: { code: "FORBIDDEN", message: "Origine refusée." } }),
    { status: 403, headers: { "content-type": "application/json" } },
  );
}

// Une mutation GraphQL arrive en POST depuis le navigateur : on vérifie
// l'Origin quand il est présent (anti-CSRF, security §8).
export async function POST(request: Request): Promise<Response> {
  if (!originAllowed(request, APP_URL)) return forbidden();
  return yoga.fetch(request);
}

// GraphiQL uniquement hors production ; en production, GET est refusé.
export async function GET(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  return yoga.fetch(request);
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204 });
}
