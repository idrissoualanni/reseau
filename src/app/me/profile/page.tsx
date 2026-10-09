import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { listOwnSkills } from "@/lib/skills";
import { toOwnProfileDto } from "@/lib/api/mappers/profile";
import { Avatar } from "@/components/avatar";
import { PageShell } from "@/components/page-shell";
import { SkillsField } from "@/components/skills-field";
import { ProfileEditor } from "./profile-editor";

export const metadata: Metadata = { title: "Mon profil" };

// Session (cookies) + redirect : route bloquante assumée (cacheComponents).
export const instant = false;

// Édition du profil + compétences (F10 + F04). Le `user_id` vient de la session.
export default async function MyProfilePage() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const skills = await listOwnSkills(profile.id);
  const dto = toOwnProfileDto(profile);

  return (
    <PageShell>
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={dto.displayName} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{dto.displayName}</h1>
          <p className="text-muted-foreground text-sm">@{dto.username}</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <ProfileEditor profile={dto} />
        <SkillsField initialSkills={skills} />
      </div>
    </PageShell>
  );
}
