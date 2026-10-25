import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { getVisibleProject, getProjectSkills } from "@/lib/projects";
import { findProfileSummariesByIds } from "@/lib/repositories/profiles";
import { toAuthorSummary } from "@/lib/api/mappers/profile";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { SkillBadge } from "@/components/skill-badge";
import { NotFoundError } from "@/lib/errors";
import { ProjectTabs } from "@/components/projects/project-tabs";

// Détail d'un projet publié (F07) + onglets V1.5 (F19/F20) : Aperçu | Activité | Discussion | Suiveurs
export const instant = false;
export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) {
    throw new Error("profil requis");
  }

  const { id } = await params;
  let project;
  let skills = [] as Awaited<ReturnType<typeof getProjectSkills>>;
  let author = null;

  try {
    project = await getVisibleProject(
      { userId: session.user.id, profileId: profile.id },
      id,
    );
    skills = await getProjectSkills(project.id);
    const authors = await findProfileSummariesByIds([project.authorId]);
    author = toAuthorSummary(authors[0] ?? null);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const isAuthor = project.authorId === profile.id;

  return (
    <PageShell width="feed">
      {/* Onglet Aperçu - contenu principal */}
      <Card>
        <CardContent className="space-y-6 p-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold">{project.title}</h1>
            {project.publishedAt ? (
              <time
                dateTime={project.publishedAt.toISOString()}
                className="text-muted-foreground text-sm"
              >
                Publié le {new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(project.publishedAt)}
              </time>
            ) : null}
          </header>

          <section className="flex items-center gap-3">
            {author ? (
              <Link
                href={`/u/${author.username}`}
                className="hover:underline focus-visible:ring-ring inline-flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2"
              >
                <Avatar name={author.displayName} src={author.avatarUrl} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{author.displayName}</span>
                  <span className="text-muted-foreground text-xs">@{author.username}</span>
                </div>
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">Auteur inconnu</span>
            )}
          </section>

          <article className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
            {project.body}
          </article>

          {skills.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Compétences</h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <SkillBadge key={skill.id} skill={skill} />
                ))}
              </div>
            </section>
          ) : null}
        </CardContent>
      </Card>

      {/* V1.5 - Onglets sociaux : Activité, Discussion, Suiveurs */}
      <ProjectTabs projectId={project.id} isAuthor={isAuthor} />
    </PageShell>
  );
}