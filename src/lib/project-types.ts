import type { ProjectType } from "@/lib/types";

// Libellés partagés du type de projet (F18) : catalogue, formulaire et gestion.
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  personal: "Personnel",
  team: "Équipe",
  open_source: "Open Source",
  research: "Recherche",
  coursework: "Cours",
};

export const PROJECT_TYPES: ProjectType[] = [
  "personal",
  "team",
  "open_source",
  "research",
  "coursework",
];
