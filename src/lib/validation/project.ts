import { z } from "zod";
import { normalizeSkillName } from "@/lib/validation/skills";
import { imageContentTypeSchema, MAX_AVATAR_IMAGE_BYTES } from "@/lib/validation/image";
import { projectTypeValues, projectReactionTypeValues } from "@/lib/types";

// Schémas partagés du module projets (F05/F06/F18/F19/F20). Les mêmes contraintes servent au
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

// Slug du référentiel `skills` : même normalisation que F04 (accents retirés,
// `[a-z0-9+#.-]`, 1–40), pour que « Réact » et « react » convergent.
const skillSlugSchema = z
  .string()
  .trim()
  .transform((value) => normalizeSkillName(value).slug)
  .refine(
    (slug) => /^[a-z0-9+#.-]{1,40}$/.test(slug),
    "Compétence invalide.",
  );

const skillSlugsSchema = z
  .array(skillSlugSchema)
  .max(MAX_SKILLS_PER_PROJECT, `Maximum ${MAX_SKILLS_PER_PROJECT} compétences.`)
  .transform((slugs) => Array.from(new Set(slugs)));

// Type de projet (F18) : personal, team, open_source, research, coursework
const projectTypeSchema = z
  .enum(projectTypeValues as [string, ...string[]], {
    errorMap: () => ({ message: "Type de projet invalide." }),
  });

// Clé de stockage d'une couverture : appartenance vérifiée par le cas d'usage
// (préfixe `projects/{profileId}/`). Le format est contrôlé ici.
const coverKeySchema = z
  .string()
  .trim()
  .max(300, "Clé d'image invalide.")
  .regex(/^projects\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/i, "Clé d'image invalide.");

// Clé de stockage d'une update projet : préfixe `projects/{profileId}/updates/`
const updateImageKeySchema = z
  .string()
  .trim()
  .max(300, "Clé d'image invalide.")
  .regex(/^projects\/[0-9a-f-]{36}\/updates\/[A-Za-z0-9._-]+$/i, "Clé d'image invalide.");

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
    type: projectTypeSchema.optional(),
  })
  .strict();

export const updateProjectSchema = z
  .object({
    title: titleSchema.optional(),
    body: bodySchema.optional(),
    skillSlugs: skillSlugsSchema.optional(),
    coverKey: coverKeySchema.nullable().optional(),
    type: projectTypeSchema.optional(),
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

// V1.5 — Filtres catalogue projets (F18)
export const listProjectsQuerySchema = z.object({
  first: z.coerce.number().int().min(1).max(50).default(20),
  after: z.string().max(500).optional(),
  skillSlugs: skillSlugsSchema.max(5, "Maximum 5 compétences pour le filtre.").optional(),
  projectTypes: z.array(projectTypeSchema).optional(),
  authorUsername: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/, "Nom d'utilisateur invalide.")
    .optional(),
  search: z.string().trim().max(100, "Recherche trop longue (100 caractères max).").optional(),
});

// V1.5 — Réactions projet (F19)
export const addProjectReactionSchema = z
  .object({
    projectId: uuidSchema,
    type: z.enum(projectReactionTypeValues as [string, ...string[]]),
  })
  .strict();

// V1.5 — Commentaires projet (F19)
const projectCommentBodySchema = z
  .string()
  .trim()
  .min(1, "Le commentaire ne peut pas être vide.")
  .max(1000, "Texte trop long (1000 caractères maximum).")
  .refine((value) => !/[<>]/.test(value), "Le texte contient des caractères interdits.");

export const createProjectCommentSchema = z
  .object({
    projectId: uuidSchema,
    parentId: uuidSchema.nullable().optional(),
    body: projectCommentBodySchema,
  })
  .strict();

// V1.5 — Suivi projet (F19)
export const followProjectSchema = z
  .object({
    projectId: uuidSchema,
  })
  .strict();

// V1.5 — Updates projet (F20)
export const createProjectUpdateSchema = z
  .object({
    projectId: uuidSchema,
    body: bodySchema,
    imageKey: updateImageKeySchema.nullable().optional(),
  })
  .strict();

export const deleteProjectUpdateSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

// Demande d'URL présignée d'upload d'une couverture de projet (F06). Mêmes
// contraintes d'image que l'avatar (5 Mo, whitelist) ; identité = session.
export const presignProjectCoverSchema = z
  .object({
    kind: z.literal("project-cover"),
    contentType: imageContentTypeSchema,
    size: z
      .number()
      .int()
      .min(1, "Fichier vide.")
      .max(MAX_AVATAR_IMAGE_BYTES, "Image trop lourde (5 Mo maximum)."),
  })
  .strict();

// V1.5 — URL présignée pour image d'update projet
export const presignProjectUpdateSchema = z
  .object({
    kind: z.literal("project-update"),
    contentType: imageContentTypeSchema,
    size: z
      .number()
      .int()
      .min(1, "Fichier vide.")
      .max(MAX_AVATAR_IMAGE_BYTES, "Image trop lourde (5 Mo maximum)."),
  })
  .strict();

export type PresignProjectCoverInput = z.infer<typeof presignProjectCoverSchema>;
export type PresignProjectUpdateInput = z.infer<typeof presignProjectUpdateSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type PublishProjectInput = z.infer<typeof publishProjectSchema>;
export type ListProjectsQueryInput = z.infer<typeof listProjectsQuerySchema>;
export type AddProjectReactionInput = z.infer<typeof addProjectReactionSchema>;
export type CreateProjectCommentInput = z.infer<typeof createProjectCommentSchema>;
export type FollowProjectInput = z.infer<typeof followProjectSchema>;
export type CreateProjectUpdateInput = z.infer<typeof createProjectUpdateSchema>;
export type DeleteProjectUpdateInput = z.infer<typeof deleteProjectUpdateSchema>;
