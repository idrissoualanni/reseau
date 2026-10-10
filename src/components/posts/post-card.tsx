import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import type { FeedPost } from "@/lib/posts-feed";
import type { ProfileSummaryRow } from "@/lib/repositories/profiles";

type PostCardProps = {
  post: FeedPost;
  author: ProfileSummaryRow | null;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

// Carte d'un post du fil (F11) : auteur, texte brut, date, nombre de
// commentaires, lien vers le détail. Composant statique.
export function PostCard({ post, author }: PostCardProps) {
  return (
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
          <time dateTime={post.createdAt} className="text-muted-foreground/70 ml-auto text-xs">
            {formatDate(post.createdAt)}
          </time>
        </div>

        <p className="text-sm whitespace-pre-wrap">{post.body}</p>

        {post.imageUrl ? (
          <Link href={`/posts/${post.id}`} className="block focus-visible:ring-ring rounded-md outline-none focus-visible:ring-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- bucket post public_read (F12) */}
            <img
              src={post.imageUrl}
              alt="Image du post"
              className="bg-surface max-h-96 w-full rounded-[14px] object-cover"
              loading="lazy"
            />
          </Link>
        ) : null}

        <div className="flex items-center gap-4 pt-1">
          <Link
            href={`/posts/${post.id}`}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm text-xs outline-none focus-visible:ring-2"
          >
            <MessageCircle className="size-4" />
            {post.commentCount > 0 ? (
              <span>
                {post.commentCount} commentaire{post.commentCount > 1 ? "s" : ""}
              </span>
            ) : (
              <span>Commenter</span>
            )}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}