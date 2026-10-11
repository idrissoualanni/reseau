import Link from "next/link";
import { listPostsForAdmin, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/components/admin/format";

export const instant = false;

// Tous les posts (F17) : lecture seule.
export default async function AdminPostsPage() {
  const session = await requireSession();
  const posts = await listPostsForAdmin(toAdminContext(session));

  if (posts.length === 0) {
    return <EmptyState title="Aucun post" description="Aucun post n'a encore été publié." />;
  }

  return (
    <ul className="divide-border divide-y rounded-lg border">
      {posts.map(({ post, author }) => (
        <li key={post.id} className="space-y-1 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href={`/u/${author.username}`} className="text-foreground font-medium hover:underline">
              {author.displayName}
            </Link>
            <span className="text-muted-foreground">@{author.username}</span>
            <span className="text-muted-foreground ml-auto tabular-nums">
              {formatDateTime(post.createdAt)}
            </span>
          </div>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {post.body.length > 200 ? `${post.body.slice(0, 200)}…` : post.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
