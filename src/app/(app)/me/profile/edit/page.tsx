import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { listOwnSkills } from "@/lib/skills";
import { toOwnProfileDto } from "@/lib/api/mappers/profile";
import { Avatar } from "@/components/avatar";
import { PageShell } from "@/components/page-shell";
import { SkillsField } from "@/components/skills-field";
import { ProfileEditor } from "../profile-editor";

export const metadata: Metadata = { title: "Modifier mon profil" };

export const instant = false;

// Édition du profil + compétences (F10 + F04). Le `user_id` vient de la session.
export default async function EditProfilePage() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const skills = await listOwnSkills(profile.id);
  const dto = toOwnProfileDto(profile);

  return (
    <PageShell>
      <div className="mb-6 space-y-2">
        <Link
          href="/me/profile"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm text-sm outline-none focus-visible:ring-2"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour au profil
        </Link>
        <div className="flex items-center gap-4">
          <Avatar name={dto.displayName} src={dto.avatarUrl} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">Modifier mon profil</h1>
            <p className="text-muted-foreground text-sm">@{dto.username}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <ProfileEditor profile={dto} />
        <SkillsField initialSkills={skills} />
      </div>
    </PageShell>
  );
}
