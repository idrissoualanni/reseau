"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Sous-navigation de la console d'administration (F17).
const TABS = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/spaces", label: "Espaces" },
  { href: "/admin/access-log", label: "Journal" },
  { href: "/admin/profiles", label: "Profils" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/projects", label: "Projets" },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections d'administration"
      className="border-border flex flex-wrap gap-1 border-b pb-2"
    >
      {TABS.map(({ href, label }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
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
