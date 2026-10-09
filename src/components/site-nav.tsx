"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/navigation";
import { cn } from "@/lib/utils";

// Barre basse mobile. Élément actif signalé par la couleur ET
// `aria-current="page"` (jamais la couleur seule, design system §5).
export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation mobile"
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur md:hidden"
    >
      <ul className="max-w-wide mx-auto flex w-full items-stretch justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 px-2 py-2 text-xs transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
