import { z } from "zod";
import {
  imageContentTypeSchema,
  imageExtension,
  MAX_IMAGE_BYTES,
} from "@/lib/validation/image";

// Schémas de validation des posts et commentaires (F11). Partagés entre le
// GraphQL et le formulaire client. `first` borné à 50 (api-graphql §7).
// Types d'image et plafonds mutualisés dans `validation/image.ts` (F12/F13).

const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Identifiant invalide.",
  );

export const postIdSchema = uuidSchema;

// Clé de stockage d'une image de post (F12) : `posts/{profileId}/{fichier}`.
// L'appartenance (préfixe = profileId du membre) est vérifiée par le cas d'usage.
export const postImageKeySchema = z
  .string()
  .trim()
  .max(300, "Clé d'image invalide.")
  .regex(/^posts\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/i, "Clé d'image invalide.");

export const MAX_POST_IMAGE_BYTES = MAX_IMAGE_BYTES;

// Demande d'URL présignée d'upload d'une image de post (F12). L'identité vient
// de la session ; le client ne fournit que le type et la taille (bornée).
export const presignPostImageSchema = z
  .object({
    kind: z.literal("post-image"),
    contentType: imageContentTypeSchema,
    size: z
      .number()
      .int()
      .min(1, "Fichier vide.")
      .max(MAX_IMAGE_BYTES, "Image trop lourde (10 Mo maximum)."),
  })
  .strict();

export { imageExtension };
export type PresignPostImageInput = z.infer<typeof presignPostImageSchema>;

export const listPostsQuerySchema = z.object({
  first: z.coerce.number().int().min(1).max(50).default(20),
  after: z.string().max(200).optional(),
});