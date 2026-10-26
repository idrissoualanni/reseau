"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProjectShareButtonProps = {
  projectTitle: string;
};

export function ProjectShareButton({ projectTitle }: ProjectShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    setError(null);
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: projectTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch (shareError) {
      // L'utilisateur peut annuler le partage natif : ne pas afficher d'erreur.
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return;
      }
      setError("Impossible de partager le lien.");
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="outline" size="sm" onClick={() => void handleShare()}>
        {copied ? (
          <Check className="size-4 text-success" />
        ) : (
          <Share2 className="size-4" />
        )}
        {copied ? "Lien copié" : "Partager"}
      </Button>
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
