import { z } from "zod";
import { imageContentTypeSchema, MAX_AVATAR_IMAGE_BYTES } from "@/lib/validation/image";

// Noms réservés : ils entrent en collision avec des routes ou des espaces
// d'administration (F03 règle 3). Comparés en minuscules.
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  "admin",
  "api",
  "help",
  "login",
  "logout",
  "me",
  "onboarding",
  "profile",
  "projects",
  "search",
  "settings",
  "sign-in",
  "sign-up",
  "support",
  "u",
]);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .string()
      .regex(
        /^[a-z0-9_]{3,30}$/,
        "3 à 30 caractères : lettres minuscules, chiffres ou tiret bas (_).",
      )
      .refine((value) => !RESERVED_USERNAMES.has(value), "Ce nom n'est pas disponible."),
  );

// Champ texte facultatif : une chaîne vide vaut `undefined` (champ non fourni).
function optionalText(max: number, message: string) {
  return z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional();
}

export const createProfileSchema = z
  .object({
    username: usernameSchema,
    displayName: z
      .string()
      .trim()
      .min(2, "Indique ton nom (2 caractères minimum).")
      .max(60, "Nom trop long (60 caractères maximum)."),
    bio: optionalText(500, "500 caractères maximum."),
    schoolName: optionalText(100, "100 caractères maximum."),
    fieldOfStudy: optionalText(100, "100 caractères maximum."),
  })
  .strict();

// Clé de stockage d'un avatar (F13) : `profiles/{profileId}/{fichier}`.
// L'appartenance (préfixe = id du profil) est vérifiée par le cas d'usage.
export const avatarKeySchema = z
  .string()
  .trim()
  .max(300, "Clé d'image invalide.")
  .regex(/^profiles\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/i, "Clé d'image invalide.");

export const updateProfileSchema = z
  .object({
    displayName: z.optional(
      z
        .string()
        .trim()
        .min(2, "Indique ton nom (2 caractères minimum).")
        .max(60, "Nom trop long (60 caractères maximum)."),
    ),
    bio: optionalText(500, "500 caractères maximum."),
    schoolName: optionalText(100, "100 caractères maximum."),
    fieldOfStudy: optionalText(100, "100 caractères maximum."),
    avatarKey: avatarKeySchema.nullable().optional(),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "Aucun champ à mettre à jour.",
  );

// Demande d'URL présignée d'upload d'un avatar (F13). Identité = session.
export const presignAvatarSchema = z
  .object({
    kind: z.literal("profile-avatar"),
    contentType: imageContentTypeSchema,
    size: z
      .number()
      .int()
      .min(1, "Fichier vide.")
      .max(MAX_AVATAR_IMAGE_BYTES, "Image trop lourde (5 Mo maximum)."),
  })
  .strict();

export type PresignAvatarInput = z.infer<typeof presignAvatarSchema>;

export const usernameQuerySchema = z.object({
  u: z.string().trim().toLowerCase().min(1, "Nom manquant.").max(30, "Nom trop long."),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
