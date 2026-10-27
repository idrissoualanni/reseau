import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PenLine, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { listOwnPosts } from "@/lib/posts";
import { galleryUrls, getPublicUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/page-shell";
import { MyPostsList } from "@/components/posts/my-posts-list";
import type { OwnPostSummary } from "@/lib/actions/posts";

export const metadata: Metadata = { title: "Mes posts" };

export const instant = false;

export default async function MyPostsPage() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const page = await listOwnPosts(
    { userId: session.user.id, profileId: profile.id },
    { limit: 20 },
  );
  const posts: OwnPostSummary[] = page.posts.map((post) => ({
    id: post.id,
    body: post.body,
    imageUrl: post.imageKey ? getPublicUrl(post.imageKey) : null,
    imageUrls: galleryUrls(post.imageKey, post.imageKeys),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }));

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <PenLine className="size-6" aria-hidden />
            Mes posts
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Modifie ou supprime tes publications.
          </p>
        </div>
        <Button asChild>
          <Link href="/posts/new">
            <Plus aria-hidden />
            Nouveau post
          </Link>
        </Button>
      </div>

      <MyPostsList
        initialPosts={posts}
        initialHasNextPage={page.hasNextPage}
        initialEndCursor={page.endCursor}
      />
    </PageShell>
  );
}
