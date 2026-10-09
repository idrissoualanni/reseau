import { builder } from "@/server/graphql/builder";

// Curseurs de pagination, communs à toutes les connexions (graphql.md §8).
export const PageInfoRef = builder
  .objectRef<{ hasNextPage: boolean; endCursor: string | null }>("PageInfo")
  .implement({
    description: "État de pagination par curseur.",
    fields: (t) => ({
      hasNextPage: t.exposeBoolean("hasNextPage"),
      endCursor: t.exposeString("endCursor", { nullable: true }),
    }),
  });
