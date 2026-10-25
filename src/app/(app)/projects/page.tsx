import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { ProjectsCatalog } from "@/components/projects/projects-catalog";

// Catalogue global des projets publiés (F18) : filtres, recherche, pagination.
export const instant = false;
export default async function ProjectsCatalogPage() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  return (
    <PageShell width="feed">
      <ProjectsCatalog />
    </PageShell>
  );
}