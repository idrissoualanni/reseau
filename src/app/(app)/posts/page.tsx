import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { loadPostsFeed } from "@/lib/posts-feed";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { PostComposer } from "@/components/posts/post-composer";
import { PostFeed } from "@/components/posts/post-feed";
import { EmptyState } from "@/components/empty-state";
import { MessageSquare } from "lucide-react";

// Fil de posts (F11) : publication + liste paginée (plus récents d'abord).
// La session est lue à chaque requête (route bloquante, pas de prerender).
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
      <div>
        <h1 className="text-2xl font-semibold">Posts</h1>
        <p className="text-muted-foreground text-sm">
          Publie une activité et discute avec la communauté.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <PostComposer />
        </CardContent>
      </Card>

      {feed.edges.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Aucun post pour l'instant."
          description="Publie le premier pour lancer la discussion."
        />
      ) : (
        <PostFeed initialPage={feed} />
      )}
    </PageShell>
  );
}