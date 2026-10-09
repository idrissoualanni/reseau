import { z } from "zod";

export const MAX_SKILLS_PER_PROFILE = 30;

// Normalisation du référentiel (F04 règle 2) : minuscules, sans accents,
// espaces et ponctuation → tirets, jeu de caractères `[a-z0-9+#.]`.
// Le nom d'affichage garde la casse saisie, nettoyée de ses espaces superflus.
export function normalizeSkillName(raw: string): { name: string; slug: string } {
  const name = raw.trim().replace(/\s+/g, " ");
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 40);
  return { name, slug };
}

// Un nom de compétence doit contenir au moins une lettre ou un chiffre, ne pas
// dépasser 40 caractères et ne pas transporter de HTML.
export const skillNameSchema = z
  .string()
  .trim()
  .min(2, "Nom de compétence trop court.")
  .max(40, "Nom de compétence trop long (40 caractères maximum).")
  .refine((value) => /[a-z0-9]/i.test(value), "Nom de compétence invalide.")
  .refine((value) => !/[<>]/.test(value), "Nom de compétence invalide.")
  .refine((value) => normalizeSkillName(value).slug.length >= 1, "Nom de compétence invalide.");

export const addSkillSchema = z.object({ name: skillNameSchema }).strict();

export const searchSkillsQuerySchema = z.object({
  q: z.string().trim().max(40, "Recherche trop longue.").default(""),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export type AddSkillInput = z.infer<typeof addSkillSchema>;
