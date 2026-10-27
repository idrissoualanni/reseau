"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MessageButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: profileId }),
      });
      const payload = (await response.json()) as { id?: string; error?: { message?: string } };
      if (!response.ok || !payload.id) {
        setError(payload.error?.message ?? "Impossible de démarrer la conversation.");
        return;
      }
      router.push(`/messages?c=${payload.id}`);
    } catch {
      setError("Impossible de démarrer la conversation.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={start} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <MessageSquare />}
        Message
      </Button>
      {error ? (
        <p role="alert" className="text-destructive max-w-56 text-right text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
