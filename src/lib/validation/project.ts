import { z } from "zod";

// Schémas partagés du module projets (F05/F06). Les mêmes contraintes servent au
// REST, au GraphQL et au formulaire client. `body` doit faire 1–5000 (contrainte
// de base) : un projet sans texte ne peut pas être publié.

export const MAX_SKILLS_PER_PROJECT = 10;
export const MAX_PROJECT_TITLE = 120;
export const MAX_PROJECT_BODY = 5000;

const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Identifiant invalide.",
  );

// Slug du référentiel `skills` : minuscules, `[a-z0-9+#.-]`, 1–40.
const skillSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9+#.-]{1,40}$/, "Compétence invalide.");

const skillSlugsSchema = z
  .array(skillSlugSchema)
  .max(MAX_SKILLS_PER_PROJECT, `Maximum ${MAX_SKILLS_PER_PROJECT} compétences.`)
  .transform((slugs) => Array.from(new Set(slugs)));

// Clé de stockage d'une couverture : appartenance vérifiée par le cas d'usage
// (préfixe `projects/{profileId}/`). Le format est contrôlé ici.
const coverKeySchema = z
  .string()
  .trim()
  .max(300, "Clé d'image invalide.")
  .regex(/^projects\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/i, "Clé d'image invalide.");

const titleSchema = z
  .string()
  .trim()
  .min(3, "Titre trop court (3 caractères minimum).")
  .max(MAX_PROJECT_TITLE, `Titre trop long (${MAX_PROJECT_TITLE} caractères maximum).`);

const bodySchema = z
  .string()
  .trim()
  .min(1, "Décris ton projet en quelques mots.")
  .max(MAX_PROJECT_BODY, `Texte trop long (${MAX_PROJECT_BODY} caractères maximum).`);

export const createProjectSchema = z
  .object({
    title: titleSchema,
    body: bodySchema,
    skillSlugs: skillSlugsSchema.default([]),
    coverKey: coverKeySchema.nullable().optional(),
  })
  .strict();

export const updateProjectSchema = z
  .object({
    title: titleSchema.optional(),
    body: bodySchema.optional(),
    skillSlugs: skillSlugsSchema.optional(),
    coverKey: coverKeySchema.nullable().optional(),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "Aucun champ à mettre à jour.",
  );

export const publishProjectSchema = z
  .object({
    coverKey: coverKeySchema.nullable().optional(),
  })
  .strict();

export const projectIdSchema = uuidSchema;

export const listProjectsQuerySchema = z.object({
  first: z.coerce.number().int().min(1).max(50).default(20),
  after: z.string().max(500).optional(),
  skillSlug: skillSlugSchema.optional(),
  authorUsername: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/, "Nom d'utilisateur invalide.")
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type PublishProjectInput = z.infer<typeof publishProjectSchema>;
