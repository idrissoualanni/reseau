"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createRealtimeClient, type RealtimeClient } from "@neon/realtime/client";
import { RealtimeProvider } from "@neon/realtime-react";
import { Loader2, Lock, RefreshCw, X } from "lucide-react";
import { ConversationSwitcher } from "@/components/messages/conversation-switcher";
import {
  MessageThread,
  ThreadPlaceholder,
} from "@/components/messages/message-thread";
import type {
  ContactRequestsState,
  ConversationDto,
} from "@/components/messages/types";
import { Button } from "@/components/ui/button";
import { ensurePublishedIdentity, loadPreviewKeys, decryptMessageEnvelope, type Identity } from "@/lib/crypto/messaging";

export function MessagesShell({
  currentProfileId,
  initialConversations,
  initialConversationId,
  initialRequests,
}: {
  currentProfileId: string;
  initialConversations: ConversationDto[];
  initialConversationId: string | null;
  initialRequests: ContactRequestsState;
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [requests, setRequests] = useState(initialRequests);
  const [activeId, setActiveId] = useState<string | null>(() =>
    initialConversationId && initialConversations.some((item) => item.id === initialConversationId)
      ? initialConversationId
      : null,
  );
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [client, setClient] = useState<RealtimeClient | null>(null);
  const [previewKeys, setPreviewKeys] = useState<Map<string, CryptoKey> | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [conversations, activeId],
  );

  const refreshConversations = useCallback(async (): Promise<ConversationDto[]> => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/conversations", { cache: "no-store" });
      const payload = (await response.json()) as {
        items?: ConversationDto[];
        error?: { message?: string };
      };
      if (response.ok && payload.items) {
        setConversations(payload.items);
        return payload.items;
      }
      return [];
    } catch {
      return [];
    } finally {
      setRefreshing(false);
    }
  }, []);

  const refreshRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/conversation-requests", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as Partial<ContactRequestsState>;
      setRequests({
        incoming: payload.incoming ?? [],
        outgoing: payload.outgoing ?? [],
      });
    } catch {
      // Le bandeau temps réel signale déjà une coupure ; on garde l'état connu.
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
    if (!identity) return;
    let cancelled = false;
    loadPreviewKeys(identity)
      .then((keys) => {
        if (!cancelled) setPreviewKeys(keys);
      })
      .catch(() => {
        if (!cancelled) setPreviewKeys(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, [identity]);

  useEffect(() => {
    if (!previewKeys) return;
    let cancelled = false;
    const entries = conversations.filter(
      (conversation) => conversation.lastMessage && previewKeys.has(conversation.id),
    );

    void Promise.all(
      entries.map(async (conversation) => {
        const key = previewKeys.get(conversation.id);
        if (!key || !conversation.lastMessage) return null;
        try {
          const text = await decryptMessageEnvelope(key, conversation.id, conversation.lastMessage);
          return [conversation.id, text] as const;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const result of results) {
        if (result) next[result[0]] = result[1];
      }
      setPreviews(next);
    });

    return () => {
      cancelled = true;
    };
  }, [previewKeys, conversations]);

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

  // Plus de polling : la liste se rafraîchit sur focus, après une action, ou
  // par le fil temps réel. La présence, elle, envoie un battement périodique.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void refreshConversations();
      void refreshRequests();
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refreshConversations, refreshRequests]);

  useEffect(() => {
    let stopped = false;
    const beat = () => {
      if (stopped || document.visibilityState !== "visible") return;
      void fetch("/api/presence", { method: "POST", cache: "no-store" }).catch(() => undefined);
    };
    beat();
    const interval = window.setInterval(beat, 45_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function select(id: string) {
    setActiveId(id);
    router.replace(`/messages?c=${id}`, { scroll: false });
  }

  async function acceptRequest(id: string) {
    setPendingRequestId(id);
    setRequestError(null);
    try {
      const response = await fetch(`/api/conversation-requests/${id}/accept`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        conversationId?: string;
        error?: { message?: string };
      };
      if (!response.ok || !payload.conversationId) {
        setRequestError(payload.error?.message ?? "Impossible d'accepter la demande.");
        return;
      }
      const items = await refreshConversations();
      await refreshRequests();
      if (items.some((conversation) => conversation.id === payload.conversationId)) {
        select(payload.conversationId);
      }
    } catch {
      setRequestError("Impossible d'accepter la demande.");
    } finally {
      setPendingRequestId(null);
    }
  }

  async function declineRequest(id: string) {
    setPendingRequestId(id);
    setRequestError(null);
    try {
      const response = await fetch(`/api/conversation-requests/${id}/decline`, {
        method: "POST",
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: { message?: string } };
        setRequestError(payload.error?.message ?? "Impossible de refuser la demande.");
        return;
      }
      await refreshRequests();
    } catch {
      setRequestError("Impossible de refuser la demande.");
    } finally {
      setPendingRequestId(null);
    }
  }

  const content = (
    <div className="flex h-[calc(100dvh-3rem)] min-h-0 flex-col md:h-dvh">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2 sm:px-4">
        <ConversationSwitcher
          conversations={conversations}
          currentProfileId={currentProfileId}
          activeId={activeId}
          loading={refreshing && conversations.length === 0}
          previews={previews}
          requests={requests}
          pendingRequestId={pendingRequestId}
          onSelect={select}
          onAcceptRequest={(id) => void acceptRequest(id)}
          onDeclineRequest={(id) => void declineRequest(id)}
        />
        <span className="text-muted-foreground ml-auto hidden items-center gap-1 text-[11px] sm:inline-flex">
          <Lock className="size-3" aria-hidden="true" />
          Chiffré de bout en bout
        </span>
      </header>

      {requestError ? (
        <div
          role="alert"
          className="bg-destructive/5 text-destructive flex items-center gap-2 border-b px-4 py-2 text-xs"
        >
          <span className="flex-1">{requestError}</span>
          <button
            type="button"
            onClick={() => setRequestError(null)}
            aria-label="Fermer le message d'erreur"
            className="hover:bg-destructive/10 rounded-sm p-0.5 transition-colors duration-[180ms]"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <section className="flex min-h-0 flex-1 flex-col">
        {identityError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="bg-secondary flex size-14 items-center justify-center rounded-full">
              <Lock className="size-6" aria-hidden="true" />
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
            <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden="true" />
            <p className="text-muted-foreground text-sm">
              Préparation de la clé de chiffrement…
            </p>
          </div>
        ) : activeConversation ? (
          <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
            <MessageThread
              key={activeConversation.id}
              conversation={activeConversation}
              currentProfileId={currentProfileId}
              identity={identity}
              realtimeAvailable={client !== null}
              onSent={() => void refreshConversations()}
            />
          </div>
        ) : (
          <ThreadPlaceholder />
        )}
      </section>
    </div>
  );

  return client ? <RealtimeProvider client={client}>{content}</RealtimeProvider> : content;
}
