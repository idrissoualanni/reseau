import type * as React from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  /** `feed` = 640 px (fil, formulaires) · `wide` = 960 px (pages denses). */
  width?: "feed" | "wide";
  className?: string;
};

// Cadre commun à toutes les pages : largeur de contenu et marges du design
// system (§3). Le <main> landmark est fourni par le layout racine.
export function PageShell({ children, width = "feed", className }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 md:py-8",
        width === "feed" ? "max-w-content" : "max-w-wide",
        className,
      )}
    >
      {children}
    </div>
  );
}
