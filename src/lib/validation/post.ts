import { z } from "zod";

// Schémas de validation des posts et commentaires (F11). Partagés entre le
// GraphQL et le formulaire client. `first` borné à 50 (api-graphql §7).

const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Identifiant invalide.",
  );

export const postIdSchema = uuidSchema;

export const listPostsQuerySchema = z.object({
  first: z.coerce.number().int().min(1).max(50).default(20),
  after: z.string().max(200).optional(),
});
