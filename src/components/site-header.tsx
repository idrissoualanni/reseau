import Link from "next/link";
import { NAV_ITEMS } from "@/components/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

// Barre haute : navigation desktop (masquée sur mobile, cf. SiteNav).
export function SiteHeader() {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div className="max-w-wide mx-auto flex h-14 w-full items-center justify-between gap-4 px-4">
        <Link href="/" className="text-foreground text-base font-semibold tracking-tight">
          Réseau
        </Link>
        <div className="flex items-center gap-1">
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
