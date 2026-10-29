"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock, Search } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ConversationDto } from "@/components/messages/types";

export function relativeTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} j`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function otherParticipant(conversation: ConversationDto, currentProfileId: string) {
  return (
    conversation.participants.find((participant) => participant.id !== currentProfileId) ??
    conversation.participants[0]
  );
}

// Corps du sélecteur de conversation : recherche + liste. Affiché dans le
// panneau déroulant de `ConversationSwitcher`.
export function ConversationList({
  conversations,
  currentProfileId,
  activeId,
  loading,
  previews,
  onSelect,
}: {
  conversations: ConversationDto[];
  currentProfileId: string;
  activeId: string | null;
  loading: boolean;
  previews: Record<string, string>;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) => {
      const other = otherParticipant(conversation, currentProfileId);
      return (
        other.displayName.toLowerCase().includes(needle) ||
        other.username.toLowerCase().includes(needle)
      );
    });
  }, [conversations, currentProfileId, query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative shrink-0 border-b p-2">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher une conversation"
          className="h-9 rounded-[10px] border-0 bg-[#F6F8FC] pl-9 shadow-none dark:bg-muted"
          aria-label="Rechercher une conversation"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        {loading && conversations.length === 0 ? (
          <div className="space-y-3 p-2">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="space-y-2 p-4 text-center">
            <p className="text-muted-foreground text-sm">
              {conversations.length === 0
                ? "Aucune conversation pour le moment."
                : "Aucune conversation ne correspond."}
            </p>
            {conversations.length === 0 ? <MessagesEmptyLink /> : null}
          </div>
        ) : (
          <ul aria-label="Conversations" className="space-y-0.5">
            {filtered.map((conversation) => {
              const other = otherParticipant(conversation, currentProfileId);
              const active = conversation.id === activeId;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "hover:bg-muted/70 flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition-colors duration-[180ms] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      active && "bg-muted",
                    )}
                  >
                    <Avatar
                      name={other.displayName}
                      src={other.avatarUrl}
                      size="md"
                      className="size-10"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {other.displayName}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-[11px]">
                          {relativeTime(conversation.lastMessageAt)}
                        </span>
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <Lock className="size-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {conversation.lastMessage
                            ? previews[conversation.id]
                              ? `${
                                  conversation.lastMessage.senderId === currentProfileId
                                    ? "Vous : "
                                    : ""
                                }${previews[conversation.id]}`
                              : "Message chiffré"
                            : "Démarrer la conversation"}
                        </span>
                      </span>
                    </span>
                    {conversation.unreadCount > 0 ? (
                      <span className="bg-primary text-primary-foreground inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                        {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function MessagesEmptyLink() {
  return (
    <Link
      href="/search"
      className="text-primary text-sm underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-sm outline-none"
    >
      Trouver un profil
    </Link>
  );
}
