"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFeed } from "@/components/projects/project-feed";
import { EmptyState } from "@/components/empty-state";
import type { FeedPage } from "@/lib/feed";
import { Filter, X, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type ProjectFilters = {
  search: string;
  skillSlugs: string[];
  projectTypes: string[];
  authorUsername: string;
};

type ProjectType = "personal" | "team" | "open_source" | "research" | "coursework";

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  personal: "Personnel",
  team: "Équipe",
  open_source: "Open Source",
  research: "Recherche",
  coursework: "Cours",
};

const PROJECT_TYPES: ProjectType[] = ["personal", "team", "open_source", "research", "coursework"];

type ProjectsCatalogProps = {
  initialProjects?: FeedPage;
  initialSkillSlugs?: string[];
};

export function ProjectsCatalog({ initialProjects, initialSkillSlugs = [] }: ProjectsCatalogProps) {
  const [filters, setFilters] = useState<ProjectFilters>({
    search: "",
    skillSlugs: initialSkillSlugs,
    projectTypes: [],
    authorUsername: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pending, startTransition] = useTransition();
  const [projects, setProjects] = useState(initialProjects ?? { edges: [], hasNextPage: false, endCursor: null });

  const activeFiltersCount = filters.skillSlugs.length + filters.projectTypes.length + (filters.authorUsername ? 1 : 0) + (filters.search ? 1 : 0);

  function handleSearchChange(value: string) {
    setFilters((prev) => ({ ...prev, search: value }));
  }

  function handleSkillSlugsChange(slugs: string[]) {
    setFilters((prev) => ({ ...prev, skillSlugs: slugs }));
  }

  function handleProjectTypesChange(types: string[]) {
    setFilters((prev) => ({ ...prev, projectTypes: types }));
  }

  function handleAuthorUsernameChange(value: string) {
    setFilters((prev) => ({ ...prev, authorUsername: value }));
  }

  function clearFilters() {
    setFilters({ search: "", skillSlugs: [], projectTypes: [], authorUsername: "" });
  }

  function handleSubmit() {
    startTransition(async () => {
      // TODO: Call GraphQL query projectsV15 with filters
      console.log("Search projects with filters:", filters);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Catalogue des projets</h1>
          <p className="text-muted-foreground text-sm">
            Explore tous les projets publiés. Filtre par compétence, type, auteur ou recherche texte.
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
          <Filter className="size-4" />
          Filtres {activeFiltersCount > 0 && <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">{activeFiltersCount}</span>}
        </Button>
      </div>

      {/* Filters panel */}
      <div className={cn("space-y-4 transition-all duration-200", showFilters ? "block" : "hidden")}>
        <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filtres</h3>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="size-3 mr-1" />
                Tout effacer
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (titre, description)..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {/* Skills */}
            <div>
              <Label htmlFor="skills">Compétences</Label>
              <Select multiple value={filters.skillSlugs} onValueChange={handleSkillSlugsChange}>
                <SelectTrigger className="w-full" id="skills">
                  <SelectValue placeholder="Sélectionner des compétences..." />
                </SelectTrigger>
                <SelectContent>
                  {/* TODO: Load skills from API */}
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="nodejs">Node.js</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Types */}
            <div>
              <Label htmlFor="types">Types de projet</Label>
              <Select multiple value={filters.projectTypes} onValueChange={handleProjectTypesChange}>
                <SelectTrigger className="w-full" id="types">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PROJECT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Author */}
            <div>
              <Label htmlFor="author">Auteur</Label>
              <Input
                id="author"
                placeholder="Nom d'utilisateur"
                value={filters.authorUsername}
                onChange={(e) => handleAuthorUsernameChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : "Filtrer"}
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {projects.edges.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="Aucun projet trouvé"
            description={activeFiltersCount > 0 ? "Essaie d'élargir tes filtres." : "Aucun projet publié pour l'instant."}
          />
        ) : (
          <>
            <ProjectFeed initialPage={projects} skillSlug={filters.skillSlugs[0]} />
          </>
        )}
      </div>
    </div>
  );
}