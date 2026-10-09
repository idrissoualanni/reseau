import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Coquille de l'application connectée : sidebar persistante + contenu.
// Les pages d'auth (groupe `(auth)`) n'en héritent pas.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
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
