import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { getOwnPost } from "@/lib/posts";
import { galleryUrls } from "@/lib/storage";
import { NotFoundError } from "@/lib/errors";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { PostEditForm } from "@/components/posts/post-edit-form";

export const metadata: Metadata = { title: "Modifier le post" };

export const instant = false;

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  let post;
  try {
    post = await getOwnPost(
      { userId: session.user.id, profileId: profile.id },
      id,
    );
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <PageShell width="feed" className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/posts/${post.id}`}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm text-sm outline-none focus-visible:ring-2"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour au post
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Modifier le post</h1>
      </div>

      <Card>
        <CardContent className="p-4">
          <PostEditForm
            post={{
              id: post.id,
              body: post.body,
              imageKeys: [post.imageKey, ...post.imageKeys].filter(
                (key): key is string => Boolean(key),
              ),
              imageUrls: galleryUrls(post.imageKey, post.imageKeys),
            }}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
