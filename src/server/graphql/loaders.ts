import DataLoader from "dataloader";
import type { Skill } from "@/lib/types";
import {
  findProfileSummariesByIds,
  type ProfileSummaryRow,
} from "@/lib/repositories/profiles";
import { listProjectSkillsForProjects } from "@/lib/repositories/projects";

// DataLoaders d'une requête (graphql.md §6) : une seule requête SQL par lot,
// résultats renvoyés dans l'ordre des clés reçues.

export type ProfileSummary = ProfileSummaryRow;

export type Loaders = {
  authorById: DataLoader<string, ProfileSummary | null>;
  skillsByProjectId: DataLoader<string, Skill[]>;
};

export function createLoaders(): Loaders {
  return {
    authorById: new DataLoader<string, ProfileSummary | null>(async (ids) => {
      const rows = await findProfileSummariesByIds([...ids]);
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.map((id) => byId.get(id) ?? null);
    }),

    skillsByProjectId: new DataLoader<string, Skill[]>(async (projectIds) => {
      const rows = await listProjectSkillsForProjects([...projectIds]);
      const grouped = new Map<string, Skill[]>();
      for (const row of rows) {
        const list = grouped.get(row.projectId) ?? [];
        list.push({ id: row.id, slug: row.slug, name: row.name });
        grouped.set(row.projectId, list);
      }
      return projectIds.map((id) => grouped.get(id) ?? []);
    }),
  };
}
