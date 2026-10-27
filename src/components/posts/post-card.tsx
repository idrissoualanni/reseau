import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageGallery } from "@/components/ui/image-gallery";
import { Avatar } from "@/components/avatar";
import { PostLikeButton } from "@/components/posts/post-like-button";
import type { FeedPost } from "@/lib/posts-feed";
import type { AuthorSummary } from "@/lib/api/mappers/profile";

type PostCardProps = {
  post: FeedPost;
  author: AuthorSummary | null;
};

// Heure seule : le jour est porté par l'en-tête de groupe (fil groupé par jour).
function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function formatFullDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso));
}

// Carte d'un post du fil (F11) : en-tête auteur, corps, image optionnelle,
// ligne d'action commentaires. L'`id` sert d'ancre `#post-<id>` pour mettre en
// évidence un post fraîchement publié (variant `target:`).
export function PostCard({ post, author }: PostCardProps) {
  return (
    <Card
      id={`post-${post.id}`}
      className="scroll-mt-20 transition-shadow target:ring-primary/40 target:ring-2"
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          {author ? (
            <Link
              href={`/u/${author.username}`}
              className="hover:underline focus-visible:ring-ring inline-flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2"
            >
              <Avatar name={author.displayName} src={author.avatarUrl} size="md" className="size-7 text-xs" />
              <span className="text-sm font-semibold">{author.displayName}</span>
            </Link>
          ) : (
            <span className="text-muted-foreground text-sm">Membre</span>
          )}
          <time
            dateTime={post.createdAt}
            title={formatFullDate(post.createdAt)}
            aria-label={formatFullDate(post.createdAt)}
            className="text-muted-foreground ml-auto text-xs"
          >
            {formatTime(post.createdAt)}
          </time>
        </div>

        <Link
          href={`/posts/${post.id}`}
          className="focus-visible:ring-ring block rounded-sm outline-none focus-visible:ring-2"
        >
          <p className="text-base leading-relaxed whitespace-pre-wrap">{post.body}</p>
        </Link>

        {post.imageUrls.length > 0 ? (
          <ImageGallery
            images={post.imageUrls}
            href={`/posts/${post.id}`}
            alt="Image du post"
            imageClassName="max-h-96 rounded-[14px]"
          />
        ) : null}

        <div className="border-border/60 flex items-center gap-4 border-t pt-3">
          <PostLikeButton
            postId={post.id}
            initialLikeCount={post.likeCount}
            initialHasLiked={post.hasLiked}
          />
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
