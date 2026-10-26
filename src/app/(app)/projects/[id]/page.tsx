import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { getVisibleProject, getProjectSkills } from "@/lib/projects";
import { findProfileSummariesByIds } from "@/lib/repositories/profiles";
import { toAuthorSummary } from "@/lib/api/mappers/profile";
import { loadProjectSocial } from "@/lib/project-social";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { SkillBadge } from "@/components/skill-badge";
import { NotFoundError } from "@/lib/errors";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { Pencil } from "lucide-react";

// Détail d'un projet publié (F07) + onglets V1.5 (F19/F20) : Aperçu | Activité | Discussion | Suiveurs
export const instant = false;

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
  const isPublished = project.status === "published";
  const social = isPublished
    ? await loadProjectSocial(
        { userId: session.user.id, profileId: profile.id },
        project.id,
      )
    : null;

  const overview = (
    <Card>
      <CardContent className="space-y-6 p-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{project.title}</h1>
                <Badge variant={isPublished ? "success" : "secondary"}>
                  {isPublished ? "Publié" : "Brouillon"}
                </Badge>
              </div>
              {project.publishedAt ? (
                <time
                  dateTime={project.publishedAt.toISOString()}
                  className="text-muted-foreground text-sm"
                >
                  Publié le{" "}
                  {new Intl.DateTimeFormat("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(project.publishedAt)}
                </time>
              ) : null}
            </div>
            {isAuthor ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/me/projects">
                  <Pencil className="size-4" />
                  Gérer
                </Link>
              </Button>
            ) : null}
          </div>
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
            <span className="text-muted-foreground text-sm">Auteur inconnu</span>
          )}
        </section>

        <article className="prose prose-sm max-w-none leading-relaxed whitespace-pre-wrap">
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
  );

  return (
    <PageShell width="feed">
      {social ? (
        <ProjectTabs
          projectId={project.id}
          viewerId={profile.id}
          isAuthor={isAuthor}
          projectTitle={project.title}
          social={social}
          overview={overview}
        />
      ) : (
        <div className="space-y-4">
          {overview}
          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="text-muted-foreground text-sm">
                Ce projet est encore un brouillon. Publie-le depuis sa gestion pour
                activer les réactions, les commentaires et les mises à jour.
              </p>
              <Button asChild>
                <Link href="/me/projects">Publier le projet</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
