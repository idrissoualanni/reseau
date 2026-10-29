"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useLiveQuery } from "@neon/realtime-react";
import type { SealedLiveQuery } from "@neon/realtime/client";
import type { EmojiClickData } from "emoji-picker-react";
import {
  Loader2,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  Smile,
  SmilePlus,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import {
  Bubble,
  BubbleContent,
  BubbleReactions,
} from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  decryptMessage,
  decryptReaction,
  encryptMessage,
  encryptReaction,
  loadConversationKey,
  messageAad,
  reactionAad,
  type Identity,
} from "@/lib/crypto/messaging";
import type {
  ConversationDto,
  LiveMessageRow,
  LivePresenceRow,
  LiveTypingRow,
  MessageDto,
  ParticipantDto,
  UiMessage,
  UiReaction,
} from "@/components/messages/types";
import { isOnline, isTyping, presenceLabel } from "@/lib/realtime/signals";

const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((module) => module.default),
  { ssr: false },
);

const MAX_MESSAGE_LENGTH = 4000;

type Bootstrap = {
  rows: LiveMessageRow[];
  nextCursor: string | null;
};

function participant(conversation: ConversationDto, currentProfileId: string): ParticipantDto {
  return (
    conversation.participants.find((item) => item.id !== currentProfileId) ??
    conversation.participants[0]
  );
}

function dtoToRow(message: MessageDto): LiveMessageRow {
  return {
    id: message.id,
    conversation_id: message.conversationId,
    sender_id: message.senderId,
    client_id: message.clientId,
    ciphertext: message.ciphertext,
    iv: message.iv,
    key_version: message.keyVersion,
    sender_key_id: message.senderKeyId,
    created_at: message.createdAt,
    edited_at: message.editedAt,
    deleted_at: message.deletedAt,
    reactions: (message.reactions ?? []).map((reaction) => ({
      profile_id: reaction.profileId,
      ciphertext: reaction.ciphertext,
      iv: reaction.iv,
      key_version: reaction.keyVersion,
      created_at: reaction.createdAt,
      updated_at: reaction.updatedAt,
    })),
  };
}

function mergeRows(live: readonly LiveMessageRow[], older: LiveMessageRow[]): LiveMessageRow[] {
  const byId = new Map<string, LiveMessageRow>();
  for (const row of older) byId.set(row.id, row);
  for (const row of live) byId.set(row.id, row);
  return [...byId.values()].sort((first, second) => {
    const firstTime = new Date(first.created_at).getTime();
    const secondTime = new Date(second.created_at).getTime();
    return firstTime === secondTime
      ? first.id.localeCompare(second.id)
      : firstTime - secondTime;
  });
}

function timeLabel(value: string): string {
  const date = new Date(value);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function groupReactions(reactions: UiReaction[]): UiReaction[] {
  return [...reactions].sort((first, second) => second.profileIds.length - first.profileIds.length);
}

export function MessageThread({
  conversation,
  currentProfileId,
  identity,
  realtimeAvailable,
  onSent,
}: {
  conversation: ConversationDto;
  currentProfileId: string;
  identity: Identity;
  realtimeAvailable: boolean;
  onSent: () => void;
}) {
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [sealed, setSealed] = useState<SealedLiveQuery<LiveMessageRow> | null>(null);
  const [typingSealed, setTypingSealed] = useState<SealedLiveQuery<LiveTypingRow> | null>(null);
  const [presenceSealed, setPresenceSealed] =
    useState<SealedLiveQuery<LivePresenceRow> | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const effectiveLiveError = realtimeAvailable ? liveError : "Temps réel non configuré.";

  useEffect(() => {
    let cancelled = false;
    loadConversationKey({
      conversationId: conversation.id,
      createdBy: conversation.createdBy,
      profileId: currentProfileId,
      identity,
    })
      .then((loaded) => {
        if (!cancelled) setKey(loaded);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setKeyError(
          error instanceof Error ? error.message : "Impossible de charger la clé de conversation.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [conversation.id, conversation.createdBy, currentProfileId, identity]);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/conversations/${conversation.id}/messages?first=50`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as {
          items?: MessageDto[];
          nextCursor?: string | null;
          error?: { message?: string };
        };
        if (!response.ok) {
          throw new Error(payload.error?.message ?? "Impossible de charger les messages.");
        }
        if (cancelled) return;
        setBootstrap({
          rows: (payload.items ?? []).map(dtoToRow),
          nextCursor: payload.nextCursor ?? null,
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setBootstrapError(
            error instanceof Error ? error.message : "Impossible de charger les messages.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, conversation.id]);

  const fetchLive = useCallback(async () => {
    const response = await fetch(`/api/conversations/${conversation.id}/live`, {
      method: "POST",
      cache: "no-store",
    });
    const payload = (await response.json()) as {
      sealedQuery?: SealedLiveQuery<LiveMessageRow>;
      typingQuery?: SealedLiveQuery<LiveTypingRow>;
      presenceQuery?: SealedLiveQuery<LivePresenceRow>;
      error?: { message?: string };
    };
    if (!response.ok || !payload.sealedQuery) {
      throw new Error(payload.error?.message ?? "Temps réel indisponible.");
    }
    return payload as {
      sealedQuery: SealedLiveQuery<LiveMessageRow>;
      typingQuery?: SealedLiveQuery<LiveTypingRow>;
      presenceQuery?: SealedLiveQuery<LivePresenceRow>;
    };
  }, [conversation.id]);

  const refreshQuery = useCallback(
    async (): Promise<SealedLiveQuery<LiveMessageRow>> => (await fetchLive()).sealedQuery,
    [fetchLive],
  );

  useEffect(() => {
    if (!key || !realtimeAvailable) return;
    let cancelled = false;
    fetchLive()
      .then((payload) => {
        if (cancelled) return;
        setSealed(payload.sealedQuery);
        if (payload.typingQuery) setTypingSealed(payload.typingQuery);
        if (payload.presenceQuery) setPresenceSealed(payload.presenceQuery);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLiveError(error instanceof Error ? error.message : "Temps réel indisponible.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, fetchLive, realtimeAvailable]);

  if (keyError) {
    return (
      <ThreadState
        icon={<Lock className="size-6" />}
        title="Chiffrement en attente"
        description={keyError}
      />
    );
  }

  if (!key || !bootstrap) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-4 p-6">
          {bootstrapError ? (
            <p role="alert" className="text-destructive text-sm">
              {bootstrapError}
            </p>
          ) : (
            <>
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="ml-auto h-16 w-3/4" />
              <Skeleton className="h-12 w-1/2" />
            </>
          )}
        </div>
      </div>
    );
  }

  if (sealed && realtimeAvailable) {
    return (
      <LiveThread
        conversation={conversation}
        currentProfileId={currentProfileId}
        identity={identity}
        conversationKey={key}
        bootstrap={bootstrap}
        sealed={sealed}
        typingSealed={typingSealed}
        presenceSealed={presenceSealed}
        refreshQuery={refreshQuery}
        onSent={onSent}
      />
    );
  }

  return (
    <ThreadView
      conversation={conversation}
      currentProfileId={currentProfileId}
      identity={identity}
      conversationKey={key}
      rows={bootstrap.rows}
      initialNextCursor={bootstrap.nextCursor}
      liveStatus={effectiveLiveError ? "offline" : "connecting"}
      liveError={effectiveLiveError}
      onSent={onSent}
    />
  );
}

function LiveThread({
  conversation,
  currentProfileId,
  identity,
  conversationKey,
  bootstrap,
  sealed,
  typingSealed,
  presenceSealed,
  refreshQuery,
  onSent,
}: {
  conversation: ConversationDto;
  currentProfileId: string;
  identity: Identity;
  conversationKey: CryptoKey;
  bootstrap: Bootstrap;
  sealed: SealedLiveQuery<LiveMessageRow>;
  typingSealed: SealedLiveQuery<LiveTypingRow> | null;
  presenceSealed: SealedLiveQuery<LivePresenceRow> | null;
  refreshQuery: () => Promise<SealedLiveQuery<LiveMessageRow>>;
  onSent: () => void;
}) {
  const { data, status, error } = useLiveQuery<LiveMessageRow>(sealed, {
    initialData: bootstrap.rows,
    refreshQuery,
  });

  return (
    <ThreadView
      conversation={conversation}
      currentProfileId={currentProfileId}
      identity={identity}
      conversationKey={conversationKey}
      rows={data ?? bootstrap.rows}
      initialNextCursor={bootstrap.nextCursor}
      typingSealed={typingSealed}
      presenceSealed={presenceSealed}
      liveStatus={status}
      liveError={status === "error" ? (error?.message ?? "Temps réel indisponible.") : null}
      onSent={onSent}
    />
  );
}

function ThreadView({
  conversation,
  currentProfileId,
  identity,
  conversationKey,
  rows,
  initialNextCursor,
  typingSealed,
  presenceSealed,
  liveStatus,
  liveError,
  onSent,
}: {
  conversation: ConversationDto;
  currentProfileId: string;
  identity: Identity;
  conversationKey: CryptoKey;
  rows: readonly LiveMessageRow[];
  initialNextCursor: string | null;
  typingSealed?: SealedLiveQuery<LiveTypingRow> | null;
  presenceSealed?: SealedLiveQuery<LivePresenceRow> | null;
  liveStatus: string;
  liveError: string | null;
  onSent: () => void;
}) {
  const [older, setOlder] = useState<LiveMessageRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState<string | null>(null);
  const [display, setDisplay] = useState<UiMessage[]>([]);
  const [decrypting, setDecrypting] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [composePicker, setComposePicker] = useState(false);
  const [caret, setCaret] = useState<number | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const readMarker = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingSentAt = useRef(0);
  const typingActive = useRef(false);
  const typingStopTimer = useRef<number | null>(null);
  const postTyping = useCallback(
    (typing: boolean) => {
      void fetch(`/api/conversations/${conversation.id}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typing }),
      }).catch(() => undefined);
    },
    [conversation.id],
  );
  const stopTyping = useCallback(() => {
    if (typingStopTimer.current !== null) {
      window.clearTimeout(typingStopTimer.current);
      typingStopTimer.current = null;
    }
    if (typingActive.current) {
      typingActive.current = false;
      postTyping(false);
    }
  }, [postTyping]);

  useEffect(() => stopTyping, [stopTyping]);

  function onTextChange(value: string) {
    setText(value);
    if (!value.trim()) {
      stopTyping();
      return;
    }
    if (!typingActive.current || Date.now() - typingSentAt.current > 2_500) {
      typingSentAt.current = Date.now();
      typingActive.current = true;
      postTyping(true);
    }
    if (typingStopTimer.current !== null) window.clearTimeout(typingStopTimer.current);
    typingStopTimer.current = window.setTimeout(stopTyping, 3_000);
  }

  useEffect(() => {
    if (caret === null) return;
    const element = textareaRef.current;
    if (!element) return;
    element.focus();
    element.setSelectionRange(caret, caret);
    setCaret(null);
  }, [caret]);

  const messages = useMemo(() => mergeRows(rows, older), [rows, older]);
  const other = participant(conversation, currentProfileId);

  useEffect(() => {
    let cancelled = false;
    async function decode() {
      const decoded = await Promise.all(
        messages.map(async (row): Promise<UiMessage> => {
          let plaintext: string | null = null;
          try {
            plaintext = await decryptMessage(
              conversationKey,
              { ciphertext: row.ciphertext, iv: row.iv },
              messageAad({
                conversationId: conversation.id,
                messageId: row.id,
                senderId: row.sender_id,
                keyVersion: row.key_version,
              }),
            );
          } catch {
            plaintext = null;
          }

          const reactionMap = new Map<string, Set<string>>();
          for (const reaction of row.reactions ?? []) {
            try {
              const emoji = await decryptReaction(
                conversationKey,
                { ciphertext: reaction.ciphertext, iv: reaction.iv },
                reactionAad({
                  messageId: row.id,
                  profileId: reaction.profile_id,
                  keyVersion: reaction.key_version,
                }),
              );
              const profiles = reactionMap.get(emoji) ?? new Set<string>();
              profiles.add(reaction.profile_id);
              reactionMap.set(emoji, profiles);
            } catch {
              // Une réaction illisible est ignorée, sans bloquer le message.
            }
          }

          return {
            id: row.id,
            senderId: row.sender_id,
            createdAt: row.created_at,
            text: plaintext,
            reactions: groupReactions(
              [...reactionMap.entries()].map(([emoji, profiles]) => ({
                emoji,
                profileIds: [...profiles],
              })),
            ),
          };
        }),
      );
      if (!cancelled) {
        setDisplay(decoded);
        setDecrypting(false);
      }
    }
    void decode();
    return () => {
      cancelled = true;
    };
  }, [messages, conversationKey, conversation.id]);

  useEffect(() => {
    const last = messages.at(-1);
    if (!last || readMarker.current === last.id) return;
    readMarker.current = last.id;
    void fetch(`/api/conversations/${conversation.id}/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  }, [messages, conversation.id]);

  async function loadOlder() {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    setOlderError(null);
    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/messages?first=50&after=${encodeURIComponent(nextCursor)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as {
        items?: MessageDto[];
        nextCursor?: string | null;
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Impossible de charger les messages précédents.");
      }
      setOlder((current) => [...current, ...(payload.items ?? []).map(dtoToRow)]);
      setNextCursor(payload.nextCursor ?? null);
    } catch (error: unknown) {
      setOlderError(
        error instanceof Error ? error.message : "Impossible de charger les messages précédents.",
      );
    } finally {
      setLoadingOlder(false);
    }
  }

  async function send(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const messageId = crypto.randomUUID();
      const envelope = await encryptMessage(
        conversationKey,
        body,
        messageAad({
          conversationId: conversation.id,
          messageId,
          senderId: currentProfileId,
          keyVersion: 1,
        }),
      );
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: messageId,
          ciphertext: envelope.ciphertext,
          iv: envelope.iv,
          keyVersion: 1,
          senderKeyId: identity.keyId,
        }),
      });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Le message n'a pas été envoyé.");
      }
      stopTyping();
      setText("");
      onSent();
    } catch (error: unknown) {
      setSendError(error instanceof Error ? error.message : "Le message n'a pas été envoyé.");
    } finally {
      setSending(false);
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    setReactionError(null);
    const current = display.find((message) => message.id === messageId);
    const existing = current?.reactions.find((reaction) =>
      reaction.profileIds.includes(currentProfileId),
    );
    try {
      if (existing?.emoji === emoji) {
        const response = await fetch(`/api/messages/${messageId}/reaction`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("La réaction n'a pas été retirée.");
      } else {
        const envelope = await encryptReaction(
          conversationKey,
          emoji,
          reactionAad({ messageId, profileId: currentProfileId, keyVersion: 1 }),
        );
        const response = await fetch(`/api/messages/${messageId}/reaction`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ciphertext: envelope.ciphertext,
            iv: envelope.iv,
            keyVersion: 1,
          }),
        });
        const payload = (await response.json()) as { error?: { message?: string } };
        if (!response.ok) {
          throw new Error(payload.error?.message ?? "La réaction n'a pas été enregistrée.");
        }
      }
      setPickerFor(null);
    } catch (error: unknown) {
      setReactionError(error instanceof Error ? error.message : "Réaction impossible.");
    }
  }

  function onEmojiClick(data: EmojiClickData) {
    if (!pickerFor) return;
    void toggleReaction(pickerFor, data.emoji);
  }

  // Insère l'emoji au curseur (pas à la fin) et rend le focus au champ.
  function insertEmoji(emoji: string) {
    const element = textareaRef.current;
    const start = element?.selectionStart ?? text.length;
    const end = element?.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${emoji}${text.slice(end)}`;
    if (next.length > MAX_MESSAGE_LENGTH) return;
    setText(next);
    setCaret(start + emoji.length);
  }

  function onComposeEmoji(data: EmojiClickData) {
    insertEmoji(data.emoji);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {liveError ? (
        <div className="border-b bg-background px-4 py-2 text-xs text-foreground dark:bg-muted">
          Temps réel indisponible : {liveError}. Les messages restent consultables.
        </div>
      ) : null}

      <div className="flex items-center gap-2.5 border-b px-4 py-2">
        <Avatar name={other.displayName} src={other.avatarUrl} size="sm" className="size-8" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{other.displayName}</p>
          <PresenceLine sealed={presenceSealed} />
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {decrypting && display.length === 0 ? (
          <div className="flex-1 space-y-4 p-6">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="ml-auto h-16 w-3/4" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        ) : display.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="bg-secondary flex size-14 items-center justify-center rounded-full">
              <MessageSquare className="text-muted-foreground size-6" />
            </span>
            <div>
              <p className="font-medium">Aucun message</p>
              <p className="text-muted-foreground text-sm">
                Écris le premier message à {other.displayName}.
              </p>
            </div>
          </div>
        ) : (
          <MessageScrollerProvider autoScroll defaultScrollPosition="end">
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="gap-4 px-4 py-6">
                  {nextCursor ? (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={loadOlder}
                        disabled={loadingOlder}
                      >
                        {loadingOlder ? <Loader2 className="animate-spin" /> : null}
                        {loadingOlder ? "Chargement…" : "Messages précédents"}
                      </Button>
                    </div>
                  ) : null}
                  {olderError ? (
                    <p role="alert" className="text-destructive text-center text-xs">
                      {olderError}
                    </p>
                  ) : null}
                  {display.map((message, index) => {
                    const isOwn = message.senderId === currentProfileId;
                    const showAvatar = !isOwn;
                    return (
                      <MessageScrollerItem
                        key={message.id}
                        messageId={message.id}
                        scrollAnchor={index === display.length - 1}
                      >
                        <Message align={isOwn ? "end" : "start"}>
                          {showAvatar ? (
                            <MessageAvatar>
                              <Avatar
                                name={other.displayName}
                                src={other.avatarUrl}
                                size="sm"
                                className="size-8"
                              />
                            </MessageAvatar>
                          ) : null}
                          <MessageContent>
                            {!isOwn ? (
                              <MessageHeader>{other.displayName}</MessageHeader>
                            ) : null}
                            <Bubble
                              align={isOwn ? "end" : "start"}
                              variant={isOwn ? "default" : "secondary"}
                            >
                              <BubbleContent
                                className={cn(
                                  "rounded-[14px] px-3.5 py-2",
                                  isOwn && "bg-primary text-primary-foreground",
                                )}
                              >
                                {message.text ?? (
                                  <span className="italic opacity-70">
                                    Message illisible (clé absente)
                                  </span>
                                )}
                              </BubbleContent>
                              {message.reactions.length > 0 ? (
                                <BubbleReactions
                                  side="bottom"
                                  align={isOwn ? "end" : "start"}
                                >
                                  {message.reactions.map((reaction) => (
                                    <button
                                      key={reaction.emoji}
                                      type="button"
                                      onClick={() => void toggleReaction(message.id, reaction.emoji)}
                                      aria-label={`Réagir ${reaction.emoji}`}
                                      aria-pressed={reaction.profileIds.includes(currentProfileId)}
                                      className={cn(
                                        "rounded-full px-1 transition-colors duration-[180ms]",
                                        reaction.profileIds.includes(currentProfileId) &&
                                          "bg-primary/10",
                                      )}
                                    >
                                      {reaction.emoji}
                                      {reaction.profileIds.length > 1
                                        ? ` ${reaction.profileIds.length}`
                                        : ""}
                                    </button>
                                  ))}
                                </BubbleReactions>
                              ) : null}
                            </Bubble>
                            <MessageFooter className="gap-2">
                              <span>{timeLabel(message.createdAt)}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setPickerFor(message.id);
                                  setComposePicker(false);
                                }}
                                aria-label="Ajouter une réaction"
                                className="hover:text-foreground text-muted-foreground transition-colors duration-[180ms]"
                              >
                                <SmilePlus className="size-3.5" />
                              </button>
                            </MessageFooter>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    );
                  })}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        )}

        {pickerFor ? (
          <>
            <button
              type="button"
              aria-label="Fermer le sélecteur d'emoji"
              className="fixed inset-0 z-40 cursor-default bg-transparent"
              onClick={() => setPickerFor(null)}
            />
            <div className="fixed right-4 bottom-28 z-50 overflow-hidden rounded-[14px] shadow-lg md:right-8">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme="auto"
                width={320}
                height={380}
                lazyLoadEmojis
                previewConfig={{ showPreview: false }}
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="relative shrink-0 border-t px-4 py-3">
        {composePicker ? (
          <>
            <button
              type="button"
              aria-label="Fermer le sélecteur d'emoji"
              className="fixed inset-0 z-40 cursor-default bg-transparent"
              onClick={() => setComposePicker(false)}
            />
            <div className="absolute right-2 bottom-full z-50 mb-2 overflow-hidden rounded-[14px] shadow-lg sm:right-4">
              <EmojiPicker
                onEmojiClick={onComposeEmoji}
                theme="auto"
                width={320}
                height={360}
                lazyLoadEmojis
                previewConfig={{ showPreview: false }}
              />
            </div>
          </>
        ) : null}
        {sendError ? (
          <p role="alert" className="text-destructive mb-2 text-xs">
            {sendError}
          </p>
        ) : null}
        {reactionError ? (
          <p role="alert" className="text-destructive mb-2 text-xs">
            {reactionError}
          </p>
        ) : null}
        <TypingLine sealed={typingSealed} name={other.displayName} />
        <form onSubmit={send} className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            onBlur={stopTyping}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            placeholder={`Écrire à ${other.displayName}…`}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
            className="max-h-32 min-h-10 resize-none rounded-[14px] py-2"
            aria-label="Message"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setComposePicker((open) => !open);
              setPickerFor(null);
            }}
            disabled={sending}
            aria-label="Insérer un emoji"
            aria-haspopup="dialog"
            aria-expanded={composePicker}
            className="shrink-0 rounded-[14px]"
          >
            <Smile />
          </Button>
          <Button
            type="submit"
            size="icon"
            disabled={sending || text.trim().length === 0}
            aria-label="Envoyer le message"
            className="shrink-0 rounded-[14px]"
          >
            {sending ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-[10px]">
          <Lock className="size-2.5" />
          Chiffré sur cet appareil · Entrée pour envoyer · Maj+Entrée pour un saut de ligne
          {liveStatus === "connecting" ? " · connexion…" : ""}
        </p>
      </div>
    </div>
  );
}

// Horloge locale : les fenêtres de saisie/présence expirent sans notification SQL.
function useNow(intervalMs: number): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, intervalMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [intervalMs]);
  return now;
}

function PresenceLine({ sealed }: { sealed?: SealedLiveQuery<LivePresenceRow> | null }) {
  if (!sealed) {
    return <span className="text-muted-foreground text-xs">Présence indisponible</span>;
  }
  return <PresenceLive sealed={sealed} />;
}

function PresenceLive({ sealed }: { sealed: SealedLiveQuery<LivePresenceRow> }) {
  const { data } = useLiveQuery<LivePresenceRow>(sealed, { initialData: [] });
  const now = useNow(15_000);
  const row = data?.[0];
  const online = now !== null && isOnline(row?.last_seen_at, now);
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          online ? "bg-[#2E9E5B]" : "bg-muted-foreground/40",
        )}
      />
      {now === null ? "…" : presenceLabel(row?.last_seen_at, now)}
    </span>
  );
}

function TypingLine({
  sealed,
  name,
}: {
  sealed?: SealedLiveQuery<LiveTypingRow> | null;
  name: string;
}) {
  if (!sealed) return null;
  return <TypingLive sealed={sealed} name={name} />;
}

function TypingLive({ sealed, name }: { sealed: SealedLiveQuery<LiveTypingRow>; name: string }) {
  const { data } = useLiveQuery<LiveTypingRow>(sealed, { initialData: [] });
  const now = useNow(1_500);
  const active = now !== null && (data ?? []).some((row) => isTyping(row.updated_at, now));
  return (
    <p aria-live="polite" className="text-muted-foreground h-4 truncate text-[11px]">
      {active ? `${name} écrit…` : ""}
    </p>
  );
}

function ThreadState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="bg-secondary flex size-14 items-center justify-center rounded-full">
        {icon}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>
      </div>
    </div>
  );
}

export function ThreadPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="bg-secondary flex size-14 items-center justify-center rounded-full">
        <ShieldCheck className="text-muted-foreground size-6" />
      </span>
      <div>
        <p className="font-medium">Choisis un contact</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Les messages sont chiffrés de bout en bout. Seuls les participants peuvent les lire.
        </p>
      </div>
    </div>
  );
}
