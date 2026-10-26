import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderKanban, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { getProjectSkills, listMyProjects } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { ProjectListItem } from "@/components/projects/project-list-item";
import { PROJECT_TYPES, PROJECT_TYPE_LABELS } from "@/lib/project-types";
import { cn } from "@/lib/utils";
import type { ProjectType, Skill } from "@/lib/types";

export const metadata: Metadata = { title: "Mes projets" };

// Session (cookies) : route bloquante assumée (cacheComponents).
export const instant = false;

// Liste des projets de l'auteur avec leur statut (F05 règle 5).
export default async function MyProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const { type } = await searchParams;
  const activeType = PROJECT_TYPES.includes(type as ProjectType)
    ? (type as ProjectType)
    : undefined;

  const ctx = { userId: session.user.id, profileId: profile.id };
  const page = await listMyProjects(ctx, 20, undefined, activeType);
  const projects = page.edges.map((edge) => edge.node);

  const skillsByProject = new Map<string, Skill[]>();
  for (const project of projects) {
    skillsByProject.set(project.id, await getProjectSkills(project.id));
  }

  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Mes projets</h1>
        <Button asChild>
          <Link href="/me/projects/new">
            <Plus aria-hidden />
            Nouveau projet
          </Link>
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Filtrer par type">
        <Link
          href="/me/projects"
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            !activeType
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-muted",
          )}
        >
          Tous
        </Link>
        {PROJECT_TYPES.map((value) => (
          <Link
            key={value}
            href={`/me/projects?type=${value}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeType === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            {PROJECT_TYPE_LABELS[value]}
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet pour l'instant."
          description="Décris un projet réalisé pour prouver ce que tu sais faire."
          action={
            <Button asChild>
              <Link href="/me/projects/new">Créer un projet</Link>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectListItem
                project={project}
                skills={skillsByProject.get(project.id) ?? []}
              />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}