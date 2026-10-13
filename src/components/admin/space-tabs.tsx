"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Sous-navigation de la console d'un espace (F17) : Détails, Membres, Accès.
export function SpaceTabs({ spaceId }: { spaceId: string }) {
  const pathname = usePathname();
  const base = `/admin/spaces/${spaceId}`;
  const tabs = [
    { href: base, label: "Détails" },
    { href: `${base}/members`, label: "Membres" },
    { href: `${base}/access`, label: "Accès" },
  ];

  return (
    <nav
      aria-label="Sections de l'espace"
      className="border-border flex flex-wrap gap-1 border-b pb-2"
    >
      {tabs.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
