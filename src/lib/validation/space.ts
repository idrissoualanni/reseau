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

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;

// ─── Rejoindre un espace / administration des membres (F15) ──────────────────

// Méthodes d'accès (ADR 0006). `email_domain` reste en V2 (F29).
export const SPACE_ACCESS_KINDS = [
  "open",
  "invite_code",
  "invite_link",
  "manual_approval",
] as const;

// Rôles portés par une appartenance.
export const MEMBERSHIP_ROLES = ["member", "space_admin"] as const;

export const spaceAccessKindSchema = z.enum(SPACE_ACCESS_KINDS);

// Corps du POST /api/spaces/[slug]/join. `code` et `token` restent optionnels :
// seule la méthode choisie dit lequel est attendu.
export const joinSpaceSchema = z
  .object({
    method: z.enum(SPACE_ACCESS_KINDS, "Choisis une méthode d'accès."),
    code: z.string().trim().min(1, "Code requis.").max(64, "64 caractères maximum.").optional(),
    token: z.string().trim().min(1, "Jeton requis.").max(128, "128 caractères maximum.").optional(),
    message: optionalText(500, "500 caractères maximum."),
  })
  .strict();

export const setMembershipRoleSchema = z
  .object({
    role: z.enum(MEMBERSHIP_ROLES, "Choisis un rôle."),
  })
  .strict();

// Configuration d'une méthode d'accès. `method` vient de la query du PUT.
export const setAccessMethodSchema = z
  .object({
    isActive: z.boolean(),
    code: z
      .string()
      .trim()
      .min(6, "6 caractères minimum.")
      .max(64, "64 caractères maximum.")
      .optional(),
    regenerate: z.boolean().optional(),
  })
  .strict();

// Décision prise par un gestionnaire sur une demande en attente.
export const MEMBERSHIP_DECISIONS = ["approve", "reject"] as const;

export const membershipDecisionSchema = z
  .object({
    action: z.enum(MEMBERSHIP_DECISIONS, "Action inconnue."),
  })
  .strict();

export type JoinSpaceInput = z.infer<typeof joinSpaceSchema>;
export type SetMembershipRoleInput = z.infer<typeof setMembershipRoleSchema>;
export type SetAccessMethodInput = z.infer<typeof setAccessMethodSchema>;
export type MembershipDecisionInput = z.infer<typeof membershipDecisionSchema>;
