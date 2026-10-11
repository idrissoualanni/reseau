import { z } from "zod";

// Validation des espaces (F14). Toute entrée serveur passe par ces schémas.

export const SPACE_TYPES = ["university", "department", "theme"] as const;
export const SPACE_VISIBILITIES = ["public", "private"] as const;

// Slugs réservés : collision avec des routes ou l'administration.
export const RESERVED_SPACE_SLUGS: ReadonlySet<string> = new Set([
  "admin",
  "api",
  "help",
  "me",
  "new",
  "settings",
  "spaces",
  "support",
]);

export const spaceSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .string()
      .regex(/^[a-z0-9-]{3,40}$/, "3 à 40 caractères : minuscules, chiffres ou tiret (-).")
      .refine((value) => !RESERVED_SPACE_SLUGS.has(value), "Ce nom d'espace n'est pas disponible."),
  );

// Champ texte facultatif : une chaîne vide vaut `undefined` (non fourni).
function optionalText(max: number, message: string) {
  return z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional();
}

const spaceNameSchema = z
  .string()
  .trim()
  .min(3, "Nom trop court (3 caractères minimum).")
  .max(80, "Nom trop long (80 caractères maximum).");

export const createSpaceSchema = z
  .object({
    slug: spaceSlugSchema,
    name: spaceNameSchema,
    description: optionalText(1000, "1000 caractères maximum."),
    type: z.enum(SPACE_TYPES, "Choisis un type d'espace."),
    visibility: z.enum(SPACE_VISIBILITIES).default("public"),
  })
  .strict();

export const updateSpaceSchema = z
  .object({
    name: spaceNameSchema.optional(),
    description: z.string().trim().max(1000, "1000 caractères maximum.").optional(),
    visibility: z.enum(SPACE_VISIBILITIES).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "Aucune modification fournie." });

// Nommer un admin plateforme (F16).
export const grantPlatformAdminSchema = z.object({ profileId: z.uuid("Profil invalide.") }).strict();

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;
export type GrantPlatformAdminInput = z.infer<typeof grantPlatformAdminSchema>;
