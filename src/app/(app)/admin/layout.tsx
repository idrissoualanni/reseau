import { notFound, redirect } from "next/navigation";
import { getPlatformAdminProfile, toAdminContext } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { AdminTabs } from "@/components/admin/admin-tabs";

export const instant = false;

// Garde serveur de la console d'administration (F17) : seuls les admins
// plateforme voient ces pages. Un membre ordinaire obtient un 404 (pas de fuite
// d'existence). Le proxy a déjà redirigé les visiteurs non connectés.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  const admin = await getPlatformAdminProfile(toAdminContext(session));
  if (!admin) notFound();

  return (
    <PageShell width="wide" className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Administration plateforme</h1>
        <p className="text-muted-foreground text-sm">
          Vue globale : espaces, membres, contenus et journal d&apos;accès.
        </p>
      </header>
      <AdminTabs />
      {children}
    </PageShell>
  );
}
