"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MessageButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      // Une conversation existante s'ouvre directement ; sinon il faut une
      // demande de contact acceptée par l'autre personne.
      const opened = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: profileId }),
      });
      if (opened.ok) {
        const payload = (await opened.json()) as { id?: string };
        if (payload.id) {
          router.push(`/messages?c=${payload.id}`);
          return;
        }
      }

      if (opened.status !== 409) {
        const payload = (await opened.json()) as { error?: { message?: string } };
        setError(payload.error?.message ?? "Impossible de démarrer la conversation.");
        return;
      }

      const requested = await fetch("/api/conversation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: profileId }),
      });
      const payload = (await requested.json()) as {
        id?: string;
        error?: { message?: string };
      };
      if (!requested.ok || !payload.id) {
        setError(payload.error?.message ?? "Impossible d'envoyer la demande de contact.");
        return;
      }
      setSent(true);
    } catch {
      setError("Impossible de démarrer la conversation.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        onClick={start}
        disabled={pending || sent}
        variant={sent ? "outline" : "default"}
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : sent ? (
          <Check />
        ) : (
          <MessageSquare />
        )}
        {sent ? "Demande envoyée" : "Message"}
      </Button>
      <div aria-live="polite" className="text-right">
        {sent ? (
          <p className="text-muted-foreground text-xs">{"En attente d'acceptation."}</p>
        ) : null}
        {error ? (
          <p role="alert" className="text-destructive max-w-56 text-xs">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
