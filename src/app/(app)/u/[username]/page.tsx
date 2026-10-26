import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOwnProfile, getPublicProfile } from "@/lib/profile";
import { listProjects } from "@/lib/projects";
import { loadAuthorPostsFeed } from "@/lib/posts-feed";
import { listProjectSkillsForProjects } from "@/lib/repositories/projects";
import { findProfileSummariesByIds } from "@/lib/repositories/profiles";
import { toAuthorSummary, type AuthorSummary } from "@/lib/api/mappers/profile";
import { getPublicUrl } from "@/lib/storage";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { SkillBadge } from "@/components/skill-badge";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { PostCard } from "@/components/posts/post-card";
import type { Skill } from "@/lib/types";

type ProjectEdge = {
  cursor: string;
  node: Awaited<ReturnType<typeof listProjects>>["edges"][number]["node"];
  skills: Skill[];
  author: AuthorSummary | null;
};

const toFeedProject = (project: ProjectEdge["node"]) => ({
  id: project.id,
  title: project.title,
  body: project.body,
  excerpt: project.body.length <= 160 ? project.body : `${project.body.slice(0, 160).trimEnd()}…`,
  coverUrl: project.coverKey ? getPublicUrl(project.coverKey) : null,
  publishedAt: project.publishedAt?.toISOString() ?? null,
  authorId: project.authorId,
});

// Profil public F08 : identité, compétences, projets publiés et posts.
// Actions de gestion uniquement sur le profil propre (règle 4 F08).
export const instant = false;
export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const session = await requireSession();
  const currentProfile = await getOwnProfile(session.user.id);
  if (!currentProfile) {
    throw new Error("profil requis");
  }

  const { username } = await params;
  const result = await getPublicProfile(username);
  if (!result) notFound();

  const { profile } = result;
  const isOwn = profile.id === currentProfile.id;

  const skills = result.skills;
  const viewer = { userId: session.user.id, profileId: currentProfile.id };
  const [projectsPage, postsPage] = await Promise.all([
    listProjects(viewer, { limit: 20, authorUsername: username }),
    loadAuthorPostsFeed(viewer, profile.id, { limit: 10 }),
  ]);

  let projectEdges: ProjectEdge[] = [];
  if (projectsPage.edges.length > 0) {
    const projectIds = projectsPage.edges.map((edge) => edge.node.id);
    const authorRows = await findProfileSummariesByIds([profile.id]);
    const skillRows = await listProjectSkillsForProjects(projectIds);
    const author = authorRows[0] ?? null;
    const skillsByProject = new Map<string, Skill[]>();
    for (const row of skillRows) {
      const list = skillsByProject.get(row.projectId) ?? [];
      list.push({ id: row.id, slug: row.slug, name: row.name });
      skillsByProject.set(row.projectId, list);
    }
    projectEdges = projectsPage.edges.map((edge) => ({
      cursor: edge.cursor,
      node: edge.node,
      skills: skillsByProject.get(edge.node.id) ?? [],
      author: toAuthorSummary(author),
    }));
  }

  return (
    <PageShell width="feed" className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar
                name={profile.displayName}
                src={profile.avatarKey ? getPublicUrl(profile.avatarKey) : null}
                size="lg"
              />
              <div>
                <h1 className="text-2xl font-semibold">{profile.displayName}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
            </div>
            {isOwn ? (
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href="/me/profile">Mon espace</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/me/profile/edit">Modifier</Link>
                </Button>
                <Button asChild>
                  <Link href="/me/projects/new">Nouveau projet</Link>
                </Button>
              </div>
            ) : null}
          </div>

          {profile.bio ? <p className="text-sm leading-relaxed">{profile.bio}</p> : null}
          {profile.schoolName ? <p className="text-muted-foreground text-sm">{profile.schoolName}</p> : null}
          {profile.fieldOfStudy ? <p className="text-muted-foreground text-sm">{profile.fieldOfStudy}</p> : null}

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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Projets publiés</h2>
          {isOwn ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/me/projects">Gérer mes projets</Link>
            </Button>
          ) : null}
        </div>
        {projectEdges.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                {isOwn ? "Tu n'as pas encore publié de projet." : "Aucun projet publié pour l'instant."}
              </p>
              {isOwn ? (
                <Button asChild className="mt-3">
                  <Link href="/me/projects/new">Créer un projet</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projectEdges.map((edge) => (
              <ProjectCard key={edge.cursor} project={toFeedProject(edge.node)} skills={edge.skills} author={edge.author} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Posts</h2>
          {isOwn ? (
            <div className="flex gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/me/posts">Gérer mes posts</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/posts/new">Nouveau post</Link>
              </Button>
            </div>
          ) : null}
        </div>
        {postsPage.edges.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                {isOwn ? "Tu n'as pas encore publié de post." : "Aucun post pour l'instant."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {postsPage.edges.map((edge) => (
              <PostCard key={edge.cursor} post={edge.post} author={edge.author} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}