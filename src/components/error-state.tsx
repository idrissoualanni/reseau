"use client";

import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

// État d'erreur obligatoire (design system §5) : message simple + « Réessayer »
// quand une nouvelle tentative a un sens.
export function ErrorState({
  title = "Une erreur est survenue",
  description = "Vérifie ta connexion et réessaie.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive/5 flex flex-col items-center gap-3 rounded-lg border px-6 py-10 text-center"
    >
      <CircleAlert className="text-destructive size-8" aria-hidden />
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      {description ? <p className="text-muted-foreground max-w-sm text-sm">{description}</p> : null}
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}
