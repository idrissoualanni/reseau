"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/avatar";
import { ImageUploader } from "@/components/image-uploader";
import { formatRelativeTime } from "@/lib/relative-time";
import { Loader2, Trash2 } from "lucide-react";
import {
  createProjectUpdateAction,
  deleteProjectUpdateAction,
  loadProjectUpdatesPageAction,
} from "@/lib/actions/project-social";
import type { ProjectUpdateView } from "@/lib/project-social";
import { MAX_PROJECT_BODY } from "@/lib/validation/project";

type ProjectActivityProps = {
  projectId: string;
  viewerId: string;
  isAuthor: boolean;
  initialUpdates: ProjectUpdateView[];
  initialHasNextPage: boolean;
  initialEndCursor: string | null;
};

export function ProjectActivity({
  projectId,
  viewerId,
  isAuthor,
  initialUpdates,
  initialHasNextPage,
  initialEndCursor,
}: ProjectActivityProps) {
  const [updates, setUpdates] = useState(initialUpdates);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [endCursor, setEndCursor] = useState(initialEndCursor);
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState("");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateUpdate() {
    if (pending) return;
    if (!body.trim() && !imageKey) return;
    setError(null);
    setPending(true);
    const result = await createProjectUpdateAction({
      projectId,
      body: body.trim() || undefined,
      imageKey,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUpdates(result.data.updates);
    setHasNextPage(result.data.hasNextPage);
    setEndCursor(result.data.endCursor);
    setComposing(false);
    setBody("");
    setImageKey(null);
    setImagePreview(null);
  }

  async function handleDeleteUpdate(id: string) {
    if (pending) return;
    setError(null);
    setPending(true);
    const result = await deleteProjectUpdateAction({ id, projectId });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUpdates(result.data.updates);
    setHasNextPage(result.data.hasNextPage);
    setEndCursor(result.data.endCursor);
  }

  async function loadMore() {
    if (pending || !hasNextPage || !endCursor) return;
    setError(null);
    setPending(true);
    const result = await loadProjectUpdatesPageAction({
      projectId,
      after: endCursor,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUpdates((current) => [
      ...current,
      ...result.data.updates.filter(
        (update) => !current.some((item) => item.id === update.id),
      ),
    ]);
    setHasNextPage(result.data.hasNextPage);
    setEndCursor(result.data.endCursor);
  }

  return (
    <div className="space-y-4">
      {isAuthor ? (
        <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
          {composing ? (
            <div className="space-y-3">
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Quelle est la progression de ton projet ?"
                className="min-h-[80px] resize-none"
                rows={3}
                maxLength={MAX_PROJECT_BODY}
              />
              <ImageUploader
                onUploaded={(key, url) => {
                  setImageKey(key);
                  setImagePreview(url);
                }}
                onRemoved={() => {
                  setImageKey(null);
                  setImagePreview(null);
                }}
                value={imagePreview}
                accept="image/jpeg,image/png,image/webp"
                maxSize={5 * 1024 * 1024}
                bucket="projet"
                prefix={`projects/${viewerId}/updates/`}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">
                  {body.length}/{MAX_PROJECT_BODY}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setComposing(false);
                      setBody("");
                      setImageKey(null);
                      setImagePreview(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void handleCreateUpdate()}
                    disabled={pending || (!body.trim() && !imageKey)}
                  >
                    {pending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Publier la mise à jour
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setComposing(true)}>
              Partager une mise à jour
            </Button>
          )}
        </div>
      ) : null}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {updates.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {isAuthor
            ? "Aucune mise à jour pour l'instant. Partage ta progression !"
            : "L'auteur n'a pas encore partagé de mise à jour."}
        </p>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <ProjectUpdateCard
              key={update.id}
              update={update}
              canDelete={update.author.id === viewerId}
              pending={pending}
              onDelete={handleDeleteUpdate}
            />
          ))}
          {hasNextPage ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => void loadMore()}
              disabled={pending}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Voir plus"}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ProjectUpdateCard({
  update,
  canDelete,
  pending,
  onDelete,
}: {
  update: ProjectUpdateView;
  canDelete: boolean;
  pending: boolean;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <article className="bg-card space-y-3 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <Avatar
          name={update.author.displayName}
          src={update.author.avatarUrl}
          size="sm"
          className="mt-1 flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/u/${update.author.username}`}
              className="text-sm font-medium hover:underline"
            >
              {update.author.displayName}
            </Link>
            <span className="text-muted-foreground text-xs">
              {formatRelativeTime(update.createdAt)}
            </span>
            {canDelete ? (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-7"
                onClick={() => void onDelete(update.id)}
                disabled={pending}
                aria-label="Supprimer la mise à jour"
              >
                <Trash2 className="text-destructive size-3.5" />
              </Button>
            ) : null}
          </div>
          {update.body ? (
            <p className="mt-1 text-sm whitespace-pre-wrap">{update.body}</p>
          ) : null}
          {update.imageUrl ? (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- bucket public_read (F20) */}
              <img
                src={update.imageUrl}
                alt="Image de la mise à jour"
                className="max-h-64 rounded-lg object-cover"
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
