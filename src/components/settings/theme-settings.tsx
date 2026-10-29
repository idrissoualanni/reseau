"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type ThemeValue = "light" | "dark" | "system";

const OPTIONS: {
  value: ThemeValue;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "light",
    label: "Clair",
    description: "Fond clair, texte foncé.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Sombre",
    description: "Fond sombre, texte clair.",
    icon: Moon,
  },
  {
    value: "system",
    label: "Système",
    description: "Suit le réglage de l'appareil.",
    icon: Monitor,
  },
];

// Choix d'apparence : trois options explicites plutôt qu'une bascule binaire.
export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Thème de l'interface"
      className="grid gap-3 sm:grid-cols-3"
    >
      {OPTIONS.map(({ value, label, description, icon: Icon }) => {
        const active = theme === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "bg-card shadow-card focus-visible:ring-ring/40 flex flex-col items-start gap-3 rounded-[14px] border p-4 text-left duration-[180ms] ease-out outline-none transition-[border-color,box-shadow] hover:border-primary/40 focus-visible:ring-[3px]",
              active ? "border-primary ring-primary/20 ring-[3px]" : "border-border",
            )}
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-[10px]",
                active
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="space-y-1">
              <span className="block text-sm font-medium">{label}</span>
              <span className="text-muted-foreground block text-xs leading-relaxed">
                {description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
