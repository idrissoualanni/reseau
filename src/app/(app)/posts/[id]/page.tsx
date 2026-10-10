import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { loadPostDetail } from "@/lib/posts-feed";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { CommentThread } from "@/components/posts/comment-thread";
import { CommentInput } from "@/components/posts/comment-input";

// Détail d'un post (F11) : texte complet + commentaires et réponses imbriquées
// (indentation max 3 niveaux visuels). La session est lue à chaque requête.
export const instant = false;
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const { id } = await params;
  const detail = await loadPostDetail(
    { userId: session.user.id, profileId: profile.id },
    id,
  );
  if (!detail) notFound();

  const { post, imageUrl, author, comments } = detail;

  return (
    <PageShell width="feed" className="space-y-6">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            {author ? (
              <Link
                href={`/u/${author.username}`}
                className="hover:underline focus-visible:ring-ring inline-flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2"
              >
                <Avatar name={author.displayName} src={null} size="md" className="size-7 text-xs" />
                <span className="text-sm font-medium">{author.displayName}</span>
              </Link>
            ) : (
              <span className="text-muted-foreground text-sm">Membre</span>
            )}
            <time
              dateTime={post.createdAt.toISOString()}
              className="text-muted-foreground/70 ml-auto text-xs"
            >
              {new Intl.DateTimeFormat("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              }).format(post.createdAt)}
            </time>
          </div>

          <p className="text-sm whitespace-pre-wrap">{post.body}</p>

          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- bucket post public_read (F12)
            <img
              src={imageUrl}
              alt="Image du post"
              className="bg-surface max-h-[32rem] w-full rounded-[14px] object-cover"
            />
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Commentaires</h2>
        <CommentInput postId={post.id} />
        <CommentThread postId={post.id} comments={comments} viewerId={profile.id} />
      </section>
    </PageShell>
  );
}