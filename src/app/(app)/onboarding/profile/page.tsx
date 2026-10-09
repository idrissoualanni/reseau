import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { PageShell } from "@/components/page-shell";
import { OnboardingProfileForm } from "./onboarding-profile-form";

export const metadata: Metadata = { title: "Créer ton profil" };

// Session (cookies) + redirect : route bloquante assumée (cacheComponents).
export const instant = false;

// Onboarding (F03) : tant qu'aucun profil n'existe, c'est la seule page utile.
export default async function OnboardingProfilePage() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (profile) redirect("/me/profile");

  return (
    <PageShell>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Crée ton profil</h1>
        <p className="text-muted-foreground text-sm">
          Ton nom d&apos;utilisateur est permanent : choisis-le bien.
        </p>
      </div>
      <OnboardingProfileForm />
    </PageShell>
  );
}
