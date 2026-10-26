import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderKanban, PenLine, Plus, Settings, UserRound } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { listMyProjects } from "@/lib/projects";
import { loadAuthorPostsFeed } from "@/lib/posts-feed";
import { getPublicUrl } from "@/lib/storage";
import { Avatar } from "@/components/avatar";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard } from "@/components/posts/post-card";
import { PROJECT_TYPE_LABELS } from "@/lib/project-types";
import { cn } from "@/lib/utils";
import type { AuthorSummary } from "@/lib/api/mappers/profile";
import type { Project } from "@/lib/types";

export const metadata: Metadata = { title: "Mon profil" };

export const instant = false;

type ProfileTab = "projects" | "posts" | "drafts";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

// Hub privé du profil : identité, projets, posts et brouillons au même endroit.
// L'édition du profil et des compétences vit sur `/me/profile/edit`.
export default async function MyProfileHubPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const { tab } = await searchParams;
  const activeTab: ProfileTab =
    tab === "posts" || tab === "drafts" ? tab : "projects";

  const ctx = { userId: session.user.id, profileId: profile.id };
  const [projectsPage, postsPage] = await Promise.all([
    listMyProjects(ctx, 50),
    loadAuthorPostsFeed(ctx, profile.id, { limit: 10 }),
  ]);

  const projects = projectsPage.edges.map((edge) => edge.node);
  const drafts = projects.filter((project) => project.status === "draft");
  const published = projects.filter((project) => project.status === "published");
  const avatarUrl = profile.avatarKey ? getPublicUrl(profile.avatarKey) : null;

  const author: AuthorSummary = {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl,
  };

  const feedPosts = postsPage.edges.map((edge) => edge.post);

  const tabs: { key: ProfileTab; label: string; count: number }[] = [
    { key: "projects", label: "Projets", count: projects.length },
    { key: "posts", label: "Posts", count: feedPosts.length },
    { key: "drafts", label: "Brouillons", count: drafts.length },
  ];

  return (
    <PageShell>
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={profile.displayName} src={avatarUrl} size="lg" />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {profile.displayName}
              </h1>
              <p className="text-muted-foreground text-sm">@{profile.username}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{published.length} publié{published.length > 1 ? "s" : ""}</Badge>
                <Badge variant="outline">{drafts.length} brouillon{drafts.length > 1 ? "s" : ""}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/u/${profile.username}`}>
                <UserRound aria-hidden />
                Profil public
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/me/profile/edit">
                <Settings aria-hidden />
                Modifier
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={item.key === "projects" ? "/me/profile" : `/me/profile?tab=${item.key}`}
            aria-current={activeTab === item.key ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === item.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            {item.label} ({item.count})
          </Link>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/me/projects/new">
              <Plus aria-hidden />
              Projet
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/posts/new">
              <PenLine aria-hidden />
              Post
            </Link>
          </Button>
        </div>
      </div>

      {activeTab === "posts" ? (
        feedPosts.length === 0 ? (
          <EmptyBlock
            icon={<PenLine className="size-8" aria-hidden />}
            title="Aucun post pour l'instant."
            description="Publie une activité pour la voir apparaître ici."
            action={<Button asChild><Link href="/posts/new">Créer un post</Link></Button>}
          />
        ) : (
          <div className="space-y-4">
            {feedPosts.map((post) => (
              <PostCard key={post.id} post={post} author={author} />
            ))}
            <div className="flex justify-center">
              <Button asChild variant="ghost">
                <Link href="/me/posts">Gérer mes posts</Link>
              </Button>
            </div>
          </div>
        )
      ) : (
        <ProjectList
          projects={activeTab === "drafts" ? drafts : projects}
          emptyTitle={activeTab === "drafts" ? "Aucun brouillon." : "Aucun projet pour l'instant."}
          emptyDescription={
            activeTab === "drafts"
              ? "Les projets enregistrés sans publication apparaissent ici."
              : "Décris un projet réalisé pour prouver ce que tu sais faire."
          }
        />
      )}
    </PageShell>
  );
}

function EmptyBlock({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
        <div className="text-muted-foreground">{icon}</div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

function ProjectList({
  projects,
  emptyTitle,
  emptyDescription,
}: {
  projects: Project[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (projects.length === 0) {
    return (
      <EmptyBlock
        icon={<FolderKanban className="size-8" aria-hidden />}
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Button asChild>
            <Link href="/me/projects/new">Créer un projet</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {projects.map((project) => (
        <li key={project.id}>
          <Card>
            <CardContent className="flex h-full flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/me/projects/${project.id}/edit`}
                  className="hover:text-primary font-semibold underline-offset-4 hover:underline"
                >
                  {project.title}
                </Link>
                <Badge variant={project.status === "published" ? "success" : "outline"}>
                  {project.status === "published" ? "Publié" : "Brouillon"}
                </Badge>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">{PROJECT_TYPE_LABELS[project.type]}</Badge>
                <span>Modifié le {formatDate(project.updatedAt)}</span>
              </div>
              <div className="mt-auto flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/me/projects/${project.id}/edit`}>Modifier</Link>
                </Button>
                {project.status === "published" ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/projects/${project.id}`}>Voir</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
