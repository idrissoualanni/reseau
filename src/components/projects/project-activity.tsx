"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/avatar";
import { ImageUploader } from "@/components/image-uploader";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, X } from "lucide-react";

type ProjectUpdate = {
  id: string;
  projectId: string;
  authorId: string;
  body: string;
  imageKey: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarKey: string | null;
  };
  imagePreview?: string | null;
};

type ProjectActivityProps = {
  projectId: string;
  isAuthor: boolean;
  initialUpdates?: ProjectUpdate[];
};

export function ProjectActivity({ projectId, isAuthor, initialUpdates = [] }: ProjectActivityProps) {
  const [updates, setUpdates] = useState(initialUpdates);
  const [pending, startTransition] = useTransition();
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState("");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function handleCreateUpdate() {
    if (!body.trim() && !imageKey) return;
    if (pending) return;

    const optimisticUpdate: ProjectUpdate = {
      id: `temp-${Date.now()}`,
      projectId,
      authorId: "current-user",
      body: body.trim(),
      imageKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: "current-user",
        username: "user",
        displayName: "Vous",
        avatarKey: null,
      },
      imagePreview,
    };

    startTransition(() => {
      setUpdates((prev) => [optimisticUpdate, ...prev]);
      setComposing(false);
      setBody("");
      setImageKey(null);
      setImagePreview(null);
    });

    try {
      console.log("Create update:", { projectId, body: body.trim(), imageKey });
    } catch (error) {
      startTransition(() => {
        setUpdates((prev) => prev.filter((u) => u.id !== optimisticUpdate.id));
      });
      console.error("Failed to create update:", error);
    }
  }

  async function handleDeleteUpdate(id: string) {
    const originalUpdates = updates;
    startTransition(() => {
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    });

    try {
      console.log("Delete update:", id);
    } catch (error) {
      startTransition(() => {
        setUpdates(originalUpdates);
      });
      console.error("Failed to delete update:", error);
    }
  }

  function handleImageUploaded(key: string, url: string) {
    setImageKey(key);
    setImagePreview(url);
  }

  function handleImageRemoved() {
    setImageKey(null);
    setImagePreview(null);
  }

  return (
    <div className="space-y-4">
      {isAuthor && (
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
          {composing ? (
            <div className="space-y-3">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Quelle est la progression de ton projet ?"
                className="min-h-[80px] resize-none"
                rows={3}
              />
              <ImageUploader
                onUploaded={handleImageUploaded}
                onRemoved={handleImageRemoved}
                value={imagePreview}
                accept="image/jpeg,image/png,image/webp"
                maxSize={5 * 1024 * 1024}
                bucket="projet"
                prefix={`projects/current-user/updates/`}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setComposing(false)}>
                  Annuler
                </Button>
                <Button size="sm" onClick={handleCreateUpdate} disabled={pending || (!body.trim() && !imageKey)}>
                  {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : "Publier la mise à jour"}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setComposing(true)}>
              Partager une mise à jour
            </Button>
          )}
        </div>
      )}

      {updates.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {isAuthor ? "Aucune mise à jour pour l'instant. Partage ta progression !" : "L'auteur n'a pas encore partagé de mise à jour."}
        </p>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <ProjectUpdateCard key={update.id} update={update} isAuthor={update.authorId === "current-user"} onDelete={handleDeleteUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectUpdateCard({ update, isAuthor, onDelete }: { update: ProjectUpdate; isAuthor: boolean; onDelete: (id: string) => void }) {
  return (
    <div className="p-4 bg-card border rounded-lg space-y-3">
      <div className="flex items-start gap-3">
        <Avatar
          name={update.author.displayName}
          src={update.author.avatarKey}
          size="sm"
          className="flex-shrink-0 mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{update.author.displayName}</span>
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true, locale: fr })}
            </span>
            {isAuthor && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto"
                onClick={() => onDelete(update.id)}
              >
                <X className="size-3 text-destructive" />
              </Button>
            )}
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap">{update.body}</p>
          {update.imageKey && update.imagePreview && (
            <div className="mt-3">
              <img
                src={update.imagePreview}
                alt="Image de la mise à jour"
                className="rounded-lg max-h-64 object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}