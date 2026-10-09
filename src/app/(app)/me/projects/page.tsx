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
import type { Skill } from "@/lib/types";

export const metadata: Metadata = { title: "Mes projets" };

// Session (cookies) : route bloquante assumée (cacheComponents).
export const instant = false;

// Liste des projets de l'auteur avec leur statut (F05 règle 5).
export default async function MyProjectsPage() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const ctx = { userId: session.user.id, profileId: profile.id };
  const page = await listMyProjects(ctx, 20);
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