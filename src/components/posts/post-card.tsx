import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageGallery } from "@/components/ui/image-gallery";
import { Avatar } from "@/components/avatar";
import { PostLikeButton } from "@/components/posts/post-like-button";
import type { FeedComment, FeedPost } from "@/lib/posts-feed";
import type { AuthorSummary } from "@/lib/api/mappers/profile";

type PostCardProps = {
  post: FeedPost;
  author: AuthorSummary | null;
  comments?: FeedComment[];
};

const MAX_PREVIEW_COMMENTS = 2;

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

// Carte d'un post du fil (F11), inspirée du fil Instagram : auteur, texte
// court, média plein cadre, actions, puis aperçu des commentaires. Aucun
// séparateur de jour : le fil reste continu. L'`id` sert d'ancre `#post-<id>`.
export function PostCard({ post, author, comments = [] }: PostCardProps) {
  const preview = comments
    .filter((comment) => comment.parentId === null)
    .slice(-MAX_PREVIEW_COMMENTS);

  return (
    <Card
      id={`post-${post.id}`}
      className="scroll-mt-20 overflow-hidden transition-shadow target:ring-primary/40 target:ring-2"
    >
      <div className="flex items-center gap-2 px-4 py-3">
        {author ? (
          <Link
            href={`/u/${author.username}`}
            className="hover:underline focus-visible:ring-ring inline-flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2"
          >
            <Avatar
              name={author.displayName}
              src={author.avatarUrl}
              size="md"
              className="size-8 text-xs"
            />
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

      {post.body.trim() ? (
        <Link
          href={`/posts/${post.id}`}
          className="focus-visible:ring-ring block rounded-sm px-4 pb-3 outline-none focus-visible:ring-2"
        >
          <p className="line-clamp-3 text-sm leading-relaxed whitespace-pre-wrap">
            {post.body}
          </p>
        </Link>
      ) : null}

      {post.imageUrls.length > 0 ? (
        <ImageGallery
          images={post.imageUrls}
          href={`/posts/${post.id}`}
          alt="Image du post"
          className="rounded-none"
          imageClassName="aspect-[4/5] max-h-[32rem]"
        />
      ) : null}

      <CardContent className="space-y-2 p-0">
        <div className="border-border/60 flex items-center gap-1 border-b px-2 py-1">
          <PostLikeButton
            postId={post.id}
            initialLikeCount={post.likeCount}
            initialHasLiked={post.hasLiked}
          />
          <Link
            href={`/posts/${post.id}`}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm px-2 py-2 text-xs outline-none focus-visible:ring-2"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            {post.commentCount > 0 ? (
              <span>
                {post.commentCount} commentaire{post.commentCount > 1 ? "s" : ""}
              </span>
            ) : (
              <span>Commenter</span>
            )}
          </Link>
        </div>

        {preview.length > 0 ? (
          <div className="space-y-1 px-4 py-3">
            {post.commentCount > preview.length ? (
              <Link
                href={`/posts/${post.id}`}
                className="text-muted-foreground hover:text-foreground block text-xs"
              >
                Voir les {post.commentCount} commentaires
              </Link>
            ) : null}
            {preview.map((comment) => (
              <p key={comment.id} className="line-clamp-1 text-sm">
                {comment.author ? (
                  <Link
                    href={`/u/${comment.author.username}`}
                    className="font-medium hover:underline"
                  >
                    {comment.author.displayName}
                  </Link>
                ) : (
                  <span className="font-medium">Membre</span>
                )}{" "}
                <span className="text-foreground/90">{comment.body}</span>
              </p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
