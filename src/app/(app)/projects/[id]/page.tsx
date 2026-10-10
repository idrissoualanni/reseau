import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { getVisibleProject, getProjectSkills } from "@/lib/projects";
import { findProfileSummariesByIds } from "@/lib/repositories/profiles";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { SkillBadge } from "@/components/skill-badge";
import { NotFoundError } from "@/lib/errors";

// Détail d'un projet publié (F07) : accessible aux membres connectés.
// Un brouillon non visible d'un tiers → 404. L'auteur voit le projet s'il
// passe par la route visible (le cas d'usage filtre par visibilité). L'édition
// utilise une route séparée (`/me/projects/[id]/edit`) pour les brouillons.
export const instant = false;
export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) {
    // Sécurise la route sans importer redirect inutilément ici ; redirection
    // via la session/profil est déjà gérée par la page feed/edit. Pour la route
    // publique, la page est protégée par requireSession + guard profil.
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
    author = authors[0] ?? null;
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <PageShell width="feed">
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
                <Avatar name={author.displayName} src={null} />
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
    </PageShell>
  );
}