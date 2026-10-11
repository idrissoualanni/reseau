import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { PostComposer } from "@/components/posts/post-composer";

export const metadata: Metadata = { title: "Nouveau post" };

// Session (cookies) : route bloquante assumée (cacheComponents).
export const instant = false;

// Page dédiée de composition d'un post (F11) : pas de fil autour, l'attention
// reste sur le contenu.
export default async function NewPostPage() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  return (
    <PageShell width="feed" className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/posts"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm text-sm outline-none focus-visible:ring-2"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour au fil
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau post</h1>
        <p className="text-muted-foreground text-sm">
          Partage une activité, une découverte ou une question avec la communauté.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <PostComposer />
        </CardContent>
      </Card>
    </PageShell>
  );
}
