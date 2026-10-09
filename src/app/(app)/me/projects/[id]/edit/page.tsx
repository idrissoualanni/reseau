import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { getOwnProject, getProjectSkills } from "@/lib/projects";
import { NotFoundError } from "@/lib/errors";
import { PageShell } from "@/components/page-shell";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata: Metadata = { title: "Modifier le projet" };

// Session (cookies) : route bloquante assumée (cacheComponents).
export const instant = false;

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

// Édition d'un projet (F05 règle 3) : l'auteur accède à ses brouillons comme à
// ses projets publiés. Invisible pour les autres → notFound().
export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const ctx = { userId: session.user.id, profileId: profile.id };
  try {
    const project = await getOwnProject(ctx, id);
    const skills = await getProjectSkills(id);

    return (
      <PageShell>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Modifier le projet</h1>
        <ProjectForm mode="edit" project={project} initialSkills={skills} />
      </PageShell>
    );
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}