"use client";

import { useState } from "react";
import { Check, ChevronDown, Loader2, Lock, MessagesSquare, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { ConversationList, otherParticipant } from "@/components/messages/conversation-list";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type {
  ContactRequestsState,
  ConversationDto,
} from "@/components/messages/types";

// Sélecteur de conversation : un seul bouton dans l'en-tête ouvre la liste, le
// fil occupe toute la largeur. Remplace l'ancienne liste en colonne fixe.
export function ConversationSwitcher({
  conversations,
  currentProfileId,
  activeId,
  loading,
  previews,
  requests,
  pendingRequestId,
  onSelect,
  onAcceptRequest,
  onDeclineRequest,
}: {
  conversations: ConversationDto[];
  currentProfileId: string;
  activeId: string | null;
  loading: boolean;
  previews: Record<string, string>;
  requests: ContactRequestsState;
  pendingRequestId: string | null;
  onSelect: (id: string) => void;
  onAcceptRequest: (id: string) => void;
  onDeclineRequest: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;
  const other = active ? otherParticipant(active, currentProfileId) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            other
              ? `Conversation avec ${other.displayName}. Changer de conversation`
              : "Choisir une conversation"
          }
          aria-haspopup="dialog"
          className="hover:bg-muted/70 flex min-w-0 max-w-full flex-1 items-center gap-3 rounded-[14px] px-2 py-1.5 text-left transition-colors duration-[180ms] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:max-w-md"
        >
          {other ? (
            <Avatar name={other.displayName} src={other.avatarUrl} size="md" className="size-9" />
          ) : (
            <span className="bg-secondary flex size-9 shrink-0 items-center justify-center rounded-full">
              <MessagesSquare className="text-muted-foreground size-4" aria-hidden="true" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold">
                {other ? other.displayName : "Choisir une conversation"}
              </span>
              {requests.incoming.length > 0 ? (
                <span className="bg-primary text-primary-foreground inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                  {requests.incoming.length}
                  <span className="sr-only"> demande(s) de contact en attente</span>
                </span>
              ) : null}
            </span>
            <span className="text-muted-foreground block truncate text-[11px]">
              {other
                ? `@${other.username}`
                : conversations.length === 0
                  ? "Aucune conversation"
                  : `${conversations.length} conversation${conversations.length > 1 ? "s" : ""}`}
            </span>
          </span>
          <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden p-0"
        aria-label="Conversations et demandes de contact"
      >
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <p className="text-sm font-semibold">Messages</p>
          <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
            <Lock className="size-3" aria-hidden="true" />
            E2E
          </span>
        </div>

        <div className="flex h-[min(32rem,70dvh)] min-h-0 flex-col">
          {requests.incoming.length > 0 ? (
            <section
              aria-label="Demandes de contact"
              className="shrink-0 border-b bg-[#F6F8FC] p-2 dark:bg-muted/40"
            >
              <p className="text-muted-foreground flex items-center gap-2 px-1 pb-1.5 text-[11px] font-semibold tracking-wide uppercase">
                Demandes de contact
                <span className="bg-primary text-primary-foreground inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px]">
                  {requests.incoming.length}
                </span>
              </p>
              <ul className="space-y-1">
                {requests.incoming.map((contactRequest) => {
                  const busy = pendingRequestId === contactRequest.id;
                  return (
                    <li
                      key={contactRequest.id}
                      className="bg-background flex items-center gap-2 rounded-[12px] px-2 py-1.5"
                    >
                      <Avatar
                        name={contactRequest.profile.displayName}
                        src={contactRequest.profile.avatarUrl}
                        size="sm"
                        className="size-8"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {contactRequest.profile.displayName}
                        </span>
                        <span className="text-muted-foreground block truncate text-[11px]">
                          @{contactRequest.profile.username} · souhaite te contacter
                        </span>
                      </span>
                      <Button
                        type="button"
                        size="icon-sm"
                        onClick={() => onAcceptRequest(contactRequest.id)}
                        disabled={busy}
                        aria-label={`Accepter la demande de ${contactRequest.profile.displayName}`}
                        title="Accepter"
                      >
                        {busy ? <Loader2 className="animate-spin" /> : <Check />}
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => onDeclineRequest(contactRequest.id)}
                        disabled={busy}
                        aria-label={`Refuser la demande de ${contactRequest.profile.displayName}`}
                        title="Refuser"
                      >
                        <X />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <div className="min-h-0 flex-1">
            <ConversationList
              conversations={conversations}
              currentProfileId={currentProfileId}
              activeId={activeId}
              loading={loading}
              previews={previews}
              onSelect={(id) => {
                setOpen(false);
                onSelect(id);
              }}
            />
          </div>

          {requests.outgoing.length > 0 ? (
            <div className="text-muted-foreground shrink-0 border-t px-3 py-2 text-[11px]">
              {"En attente d'acceptation : "}
              {requests.outgoing.map((item) => item.profile.displayName).join(", ")}
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
