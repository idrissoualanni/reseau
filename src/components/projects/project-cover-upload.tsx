"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_AVATAR_IMAGE_BYTES } from "@/lib/validation/image";

// Champ de couverture d'un projet (F06) : aperçu, sélection d'un fichier et
// retrait. Le presign PUT est fait par le formulaire parent au submit ; ici on
// ne gère que l'aperçu et on remonte les événements (fichier choisi / retrait).
type ProjectCoverUploadProps = {
  initialUrl?: string | null;
  error?: string;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
};

export function ProjectCoverUpload({
  initialUrl,
  error,
  disabled,
  onFileChange,
  onRemove,
}: ProjectCoverUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  const coverUrl = removed ? null : previewUrl ?? initialUrl ?? null;

  function pickImage(file: File | null) {
    setLocalError(null);
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setLocalError("Format d'image non supporté.");
      return;
    }
    if (file.size > MAX_AVATAR_IMAGE_BYTES) {
      setLocalError("Image trop lourde (5 Mo maximum).");
      return;
    }
    setRemoved(false);
    setPreviewUrl(URL.createObjectURL(file));
    onFileChange(file);
  }

  function removeCover() {
    setLocalError(null);
    setPreviewUrl(null);
    setRemoved(true);
    onRemove();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <span className="text-foreground block text-sm font-medium">Couverture</span>

      {coverUrl ? (
        <div className="relative overflow-hidden rounded-[14px]">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local ou URL publique (bucket public_read) */}
          <img
            src={coverUrl}
            alt="Aperçu de la couverture du projet"
            className="bg-surface aspect-[2/1] w-full object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={removeCover}
            disabled={disabled}
            aria-label="Retirer la couverture"
            className="bg-background/80 absolute top-2 right-2"
          >
            <X />
          </Button>
        </div>
      ) : (
        <div
          aria-hidden
          className="bg-muted flex aspect-[2/1] w-full items-center justify-center rounded-[14px]"
        >
          <ImagePlus className="text-muted-foreground/40 size-8" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        id="project-cover"
        onChange={(event) => pickImage(event.target.files?.[0] ?? null)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <ImagePlus />
          {previewUrl || (!removed && initialUrl) ? "Changer l'image" : "Ajouter une image"}
        </Button>
        <p className="text-muted-foreground text-xs">
          JPEG, PNG, WebP ou GIF, 5 Mo maximum.
        </p>
      </div>

      {localError || error ? (
        <p role="alert" className="text-destructive text-sm">
          {error ?? localError}
        </p>
      ) : null}
    </div>
  );
}