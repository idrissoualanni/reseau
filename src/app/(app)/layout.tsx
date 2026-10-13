import { redirect } from "next/navigation";
import { AppSidebar, type SidebarUser } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getPlatformAdminProfile, toAdminContext } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import { isEmailVerified } from "@/lib/auth-guard";
import { getOwnProfile } from "@/lib/profile";
import { getPublicUrl } from "@/lib/storage";

// Coquille de l'application connectée : sidebar persistante + contenu.
// Les pages d'auth (groupe `(auth)`) n'en héritent pas.
// L'utilisateur est chargé côté serveur (cookies) et passé au sidebar.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Un compte authentifié mais non vérifié ne doit pas atteindre l'app.
  if (session?.user && !isEmailVerified(session.user)) {
    redirect("/verify-email");
  }

  const profile = session?.user ? await getOwnProfile(session.user.id) : null;
  const isAdmin = session?.user
    ? (await getPlatformAdminProfile(toAdminContext(session))) !== null
    : false;

  const user: SidebarUser | null = profile
    ? {
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarKey ? getPublicUrl(profile.avatarKey) : null,
        email: session?.user?.email,
      }
    : null;

  return (
    <SidebarProvider>
      <AppSidebar user={user} isAdmin={isAdmin} />
      <SidebarInset>
        <div className="border-border bg-background/80 sticky top-0 z-30 flex h-12 items-center border-b px-4 backdrop-blur md:hidden">
          <SidebarTrigger />
          <span className="text-foreground ml-2 text-base font-semibold tracking-tight">
            Réseau
          </span>
        </div>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}