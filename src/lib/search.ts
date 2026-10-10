import { normalizeSkillName } from "@/lib/validation/skills";
import { decodeTupleCursor, encodeTupleCursor } from "@/lib/pagination";
import type { ViewerContext } from "@/lib/context";
import { searchSkills } from "@/lib/repositories/skills";
import { getPublicUrl } from "@/lib/storage";
import {
  findSkillBySlugForSearch,
  searchStudentsBySkill,
  toSearchCursor,
  type SearchCursor,
  type StudentSearchResult,
} from "@/lib/repositories/search";
import type { Skill } from "@/lib/types";

// Recherche d'étudiants par compétence (F09). L'entrée est normalisée avec le
// même slugify que F04 ; une compétence inconnue renvoie une liste vide plus
// des suggestions proches (trigramme). Le membre connecté apparaît dans les
// résultats comme les autres (règle 6) : aucun filtrage par identité.

export type StudentResult = {
  id: string;
  username: string;
  displayName: string;
  schoolName: string | null;
  fieldOfStudy: string | null;
  avatarUrl: string | null;
  createdAt: string;
  proofLevel: StudentSearchResult["proofLevel"];
  projectCount: number;
};

export type SearchStudentsOutput = {
  items: StudentResult[];
  nextCursor: string | null;
  suggestions: Skill[];
  skill: Skill | null;
};

export type SearchStudentsInput = {
  skill: string;
  limit: number;
  cursor?: string;
};

function toResult(row: StudentSearchResult): StudentResult {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    schoolName: row.schoolName,
    fieldOfStudy: row.fieldOfStudy,
    avatarUrl: row.avatarKey ? getPublicUrl(row.avatarKey) : null,
    createdAt: row.createdAt.toISOString(),
    proofLevel: row.proofLevel,
    projectCount: row.projectCount,
  };
}

export async function searchStudents(
  _ctx: ViewerContext,
  input: SearchStudentsInput,
): Promise<SearchStudentsOutput> {
  const { slug } = normalizeSkillName(input.skill);
  if (slug.length === 0) {
    return { items: [], nextCursor: null, suggestions: [], skill: null };
  }

  const skill = await findSkillBySlugForSearch(slug);
  if (!skill) {
    // Compétence inconnue : 200 avec liste vide + suggestions proches (F09 règle 4).
    const suggestions = await searchSkills(input.skill, 5);
    return { items: [], nextCursor: null, suggestions, skill: null };
  }

  let cursor: SearchCursor | undefined;
  if (input.cursor) {
    const [proofRank, projectCount, createdAt, id] = decodeTupleCursor(input.cursor);
    if (
      typeof proofRank !== "number" ||
      typeof projectCount !== "number" ||
      !(createdAt instanceof Date) ||
      typeof id !== "string"
    ) {
      throw new Error("Curseur invalide.");
    }
    cursor = { proofRank, projectCount, createdAt, id };
  }

  const rows = await searchStudentsBySkill(skill.id, input.limit, cursor);
  const hasMore = rows.length > input.limit;
  const pageRows = hasMore ? rows.slice(0, input.limit) : rows;
  const items = pageRows.map(toResult);

  const nextCursor =
    hasMore && pageRows.length > 0
      ? encodeTupleCursor((() => {
          const last = pageRows[pageRows.length - 1];
          const c = toSearchCursor(last);
          return [c.proofRank, c.projectCount, c.createdAt, c.id];
        })())
      : null;

  return { items, nextCursor, suggestions: [], skill };
}