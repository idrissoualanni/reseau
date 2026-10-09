import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { PageShell } from "@/components/page-shell";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata: Metadata = { title: "Nouveau projet" };

// Session (cookies) : route bloquante assumée (cacheComponents).
export const instant = false;

// Création d'un projet (F05) : brouillon ou publication directe (F06).
export default async function NewProjectPage() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  return (
    <PageShell>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Nouveau projet</h1>
      <ProjectForm mode="create" />
    </PageShell>
  );
}