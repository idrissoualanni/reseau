"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createRealtimeClient, type RealtimeClient } from "@neon/realtime/client";
import { RealtimeProvider } from "@neon/realtime-react";
import { Loader2, Lock, RefreshCw } from "lucide-react";
import { ConversationList } from "@/components/messages/conversation-list";
import {
  MessageThread,
  ThreadPlaceholder,
} from "@/components/messages/message-thread";
import type { ConversationDto } from "@/components/messages/types";
import { Button } from "@/components/ui/button";
import { ensurePublishedIdentity, type Identity } from "@/lib/crypto/messaging";
import { cn } from "@/lib/utils";

export function MessagesShell({
  currentProfileId,
  initialConversations,
  initialConversationId,
}: {
  currentProfileId: string;
  initialConversations: ConversationDto[];
  initialConversationId: string | null;
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(() =>
    initialConversationId && initialConversations.some((item) => item.id === initialConversationId)
      ? initialConversationId
      : null,
  );
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [client, setClient] = useState<RealtimeClient | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [conversations, activeId],
  );

  const refreshConversations = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/conversations", { cache: "no-store" });
      const payload = (await response.json()) as {
        items?: ConversationDto[];
        error?: { message?: string };
      };
      if (response.ok && payload.items) setConversations(payload.items);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    ensurePublishedIdentity(currentProfileId)
      .then((loaded) => {
        if (!cancelled) setIdentity(loaded);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setIdentityError(
            error instanceof Error
              ? error.message
              : "Impossible de préparer le chiffrement de bout en bout.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentProfileId]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_NEON_REALTIME_URL;
    if (!url) return;
    const realtime = createRealtimeClient({ url });
    const timer = window.setTimeout(() => setClient(realtime), 0);
    return () => {
      window.clearTimeout(timer);
      realtime.close();
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshConversations();
    }, 20_000);
    const onFocus = () => void refreshConversations();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshConversations]);

  function select(id: string) {
    setActiveId(id);
    router.replace(`/messages?c=${id}`, { scroll: false });
  }

  function back() {
    setActiveId(null);
    router.replace("/messages", { scroll: false });
  }

  const content = (
    <div className="flex h-[calc(100dvh-3rem)] min-h-0 md:h-dvh">
      <aside
        className={cn(
          "bg-background min-h-0 w-full shrink-0 border-r md:flex md:w-80 lg:w-96",
          activeId ? "hidden md:flex" : "flex",
        )}
      >
        <ConversationList
          conversations={conversations}
          currentProfileId={currentProfileId}
          activeId={activeId}
          loading={refreshing && conversations.length === 0}
          onSelect={select}
        />
      </aside>

      <section className={cn("min-w-0 flex-1", activeId ? "flex" : "hidden md:flex")}>
        {identityError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="bg-secondary flex size-14 items-center justify-center rounded-full">
              <Lock className="size-6" />
            </span>
            <div>
              <p className="font-medium">Chiffrement indisponible</p>
              <p className="text-muted-foreground mt-1 max-w-md text-sm">{identityError}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw />
              Réessayer
            </Button>
          </div>
        ) : !identity ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
            <p className="text-muted-foreground text-sm">
              Préparation de la clé de chiffrement…
            </p>
          </div>
        ) : activeConversation ? (
          <MessageThread
            key={activeConversation.id}
            conversation={activeConversation}
            currentProfileId={currentProfileId}
            identity={identity}
            realtimeAvailable={client !== null}
            onBack={back}
            onSent={() => void refreshConversations()}
          />
        ) : (
          <ThreadPlaceholder />
        )}
      </section>
    </div>
  );

  return client ? <RealtimeProvider client={client}>{content}</RealtimeProvider> : content;
}
