import { z } from "zod";

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

export const updateProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Indique ton nom (2 caractères minimum).")
      .max(60, "Nom trop long (60 caractères maximum).")
      .optional(),
    bio: optionalText(500, "500 caractères maximum."),
    schoolName: optionalText(100, "100 caractères maximum."),
    fieldOfStudy: optionalText(100, "100 caractères maximum."),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "Aucun champ à mettre à jour.",
  );

export const usernameQuerySchema = z.object({
  u: z.string().trim().toLowerCase().min(1, "Nom manquant.").max(30, "Nom trop long."),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
