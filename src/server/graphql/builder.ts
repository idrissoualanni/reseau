import SchemaBuilder from "@pothos/core";
import type { Loaders } from "./loaders";

// Contexte GraphQL construit à CHAQUE requête (graphql.md §3). L'identité vient
// de la session : jamais d'un argument client.
export type GraphQLContext = {
  userId: string | null;
  profileId: string | null;
  loaders: Loaders;
};

export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  Scalars: { DateTime: { Input: Date; Output: Date } };
}>({});

// Les types racine sont créés ici pour que les fichiers `types/*` puissent
// enregistrer leurs champs à l'import, sans dépendre de l'ordre d'import.
builder.queryType({});
builder.mutationType({});

// Scalar DateTime : sérialisé en ISO 8601 UTC (graphql.md §11).
builder.scalarType("DateTime", {
  serialize: (value) => value.toISOString(),
  parseValue: (value) => {
    if (typeof value !== "string") throw new Error("DateTime attendu.");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error("DateTime invalide.");
    return date;
  },
});
