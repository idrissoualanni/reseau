"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageUploaderProps = {
  onUploaded: (key: string, url: string) => void;
  onRemoved: () => void;
  value?: string | null;
  accept?: string;
  maxSize?: number;
  bucket: string;
  prefix: string;
  className?: string;
};

export function ImageUploader({
  onUploaded,
  onRemoved,
  value,
  accept = "image/jpeg,image/png,image/webp",
  maxSize = 5 * 1024 * 1024,
  bucket,
  prefix,
  className,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!file.type.match(accept.replace(/,/g, "|"))) {
      return "Format d'image non supporté (JPEG, PNG, WebP uniquement).";
    }
    if (file.size > maxSize) {
      return `Image trop lourde (${Math.round(maxSize / 1024 / 1024)} Mo maximum).`;
    }
    return null;
  };

  const getPresignedUrl = async (file: File): Promise<{ uploadUrl: string; key: string; publicUrl: string }> => {
    const response = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: bucket === "projet" ? "project-update" : "project-cover",
        contentType: file.type,
        size: file.size,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erreur lors de la génération de l'URL d'upload");
    }

    return response.json();
  };

  const uploadToStorage = async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Échec de l'upload vers le stockage");
    }
  };

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setUploading(true);
      try {
        const { uploadUrl, key, publicUrl } = await getPresignedUrl(file);
        await uploadToStorage(uploadUrl, file);
        setPreviewUrl(publicUrl);
        onUploaded(key, publicUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
      } finally {
        setUploading(false);
        if (event.target) event.target.value = "";
      }
    },
    [bucket, maxSize, accept, onUploaded]
  );

  const handleRemove = useCallback(() => {
    setPreviewUrl(null);
    onRemoved();
  }, [onRemoved]);

  const hasImage = !!previewUrl;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone / Preview */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          hasImage ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
        )}
        onClick={() => !hasImage && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileSelect}
          disabled={uploading}
        />

        {hasImage ? (
          <div className="relative aspect-video w-full max-w-md mx-auto">
            <img
              src={previewUrl!}
              alt="Aperçu de l'image"
              className="w-full h-full object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <Upload className="size-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Cliquer pour choisir une image</p>
              <p className="text-xs text-muted-foreground">
                {accept.split(",").map((t) => t.trim().replace("image/", "").toUpperCase()).join(", ")} • {Math.round(maxSize / 1024 / 1024)} Mo max
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Upload en cours...</span>
        </div>
      )}
    </div>
  );
}