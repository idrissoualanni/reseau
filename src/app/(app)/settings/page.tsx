import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { ThemeSettings } from "@/components/settings/theme-settings";

export const metadata: Metadata = { title: "Paramètres" };

export default function SettingsPage() {
  return (
    <PageShell>
      <header className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground text-sm">
          Personnalise l&apos;apparence de Réseau sur cet appareil.
        </p>
      </header>

      <section aria-labelledby="appearance-title" className="space-y-4">
        <div className="space-y-1">
          <h2 id="appearance-title" className="text-base font-semibold">
            Apparence
          </h2>
          <p className="text-muted-foreground text-sm">
            Le choix est enregistré dans ce navigateur.
          </p>
        </div>
        <ThemeSettings />
      </section>
    </PageShell>
  );
}
