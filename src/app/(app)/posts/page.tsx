import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { loadPostsFeed } from "@/lib/posts-feed";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { PostFeed } from "@/components/posts/post-feed";
import { EmptyState } from "@/components/empty-state";

// Fil de posts (F11) : lecture groupée par jour + CTA vers la page de
// composition dédiée. La session est lue à chaque requête (route bloquante).
export const instant = false;
export default async function PostsPage() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const feed = await loadPostsFeed(
    { userId: session.user.id, profileId: profile.id },
    { limit: 20 },
  );

  return (
    <PageShell width="feed" className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="text-muted-foreground text-sm">
            Publie une activité et discute avec la communauté.
          </p>
        </div>
        <Button asChild size="icon" aria-label="Publier un post" title="Publier un post">
          <Link href="/posts/new">
            <Plus aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {feed.edges.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Aucun post pour l'instant."
          description="Publie le premier pour lancer la discussion."
          action={
            <Button asChild>
              <Link href="/posts/new">Publier le premier post</Link>
            </Button>
          }
        />
      ) : (
        <PostFeed initialPage={feed} />
      )}
    </PageShell>
  );
}
