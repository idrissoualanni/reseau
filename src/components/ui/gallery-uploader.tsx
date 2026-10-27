"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadKind = "post-image" | "project-cover";

type GalleryImage = {
  key: string | null;
  url: string;
  uploading?: boolean;
};

type GalleryUploaderProps = {
  kind: UploadKind;
  coverField: string;
  galleryField?: string;
  initialKeys?: string[];
  initialUrls?: string[];
  max?: number;
  maxSizeMb?: number;
  className?: string;
  onUploadingChange?: (uploading: boolean) => void;
};

type PresignResponse = { uploadUrl: string; key: string; publicUrl: string };

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_IMAGES = 5;

// Galerie de 5 images maximum (V1.5) : la première est la couverture. Les clés
// partent dans des champs cachés (`imageKey` + `imageKeys`) lus par le serveur.
export function GalleryUploader({
  kind,
  coverField,
  galleryField = "imageKeys",
  initialKeys = [],
  initialUrls = [],
  max = MAX_IMAGES,
  maxSizeMb = 10,
  className,
  onUploadingChange,
}: GalleryUploaderProps) {
  const [images, setImages] = useState<GalleryImage[]>(
    initialKeys.map((key, position) => ({
      key,
      url: initialUrls[position] ?? "",
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploading = images.some((image) => image.uploading);
  const remaining = max - images.length;

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  function validate(file: File): string | null {
    if (!ACCEPT.split(",").includes(file.type)) {
      return "Format non supporté (JPEG, PNG ou WebP).";
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `Image trop lourde (${maxSizeMb} Mo maximum).`;
    }
    return null;
  }

  async function upload(file: File): Promise<GalleryImage> {
    const presign = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, contentType: file.type, size: file.size }),
    });
    if (!presign.ok) {
      const body = await presign.json().catch(() => null);
      throw new Error(body?.error?.message ?? "L'upload a échoué.");
    }
    const { uploadUrl, key, publicUrl } = (await presign.json()) as PresignResponse;
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) throw new Error("L'upload de l'image a échoué.");
    return { key, url: publicUrl };
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const selected = Array.from(files).slice(0, remaining);
    const valid: File[] = [];
    for (const file of selected) {
      const message = validate(file);
      if (message) {
        setError(message);
        return;
      }
      valid.push(file);
    }

    // Emplacements optimistes avec aperçu local pendant l'upload.
    const slots = valid.map((file) => ({
      key: null,
      url: URL.createObjectURL(file),
      uploading: true,
    }));
    const start = images.length;
    setImages((current) => [...current, ...slots]);

    for (const [offset, file] of valid.entries()) {
      try {
        const uploaded = await upload(file);
        setImages((current) =>
          current.map((image, position) =>
            position === start + offset ? uploaded : image,
          ),
        );
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload impossible.");
        setImages((current) =>
          current.filter((_, position) => position !== start + offset),
        );
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAt(index: number) {
    setImages((current) => current.filter((_, position) => position !== index));
  }

  const coverKey = images[0]?.key ?? "";
  const extraKeys = images.slice(1).map((image) => image.key);

  return (
    <div className={cn("space-y-2", className)}>
      <input type="hidden" name={coverField} value={coverKey} />
      {extraKeys.length === 0 ? (
        <input type="hidden" name={galleryField} value="" />
      ) : (
        extraKeys.map((key) =>
          key ? <input key={key} type="hidden" name={galleryField} value={key} /> : null,
        )
      )}

      {images.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`} className="relative">
              <div className="bg-muted relative aspect-square overflow-hidden rounded-[14px]">
                {image.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- aperçu local ou bucket public_read */
                  <img
                    src={image.url}
                    alt={`Image ${index + 1} sur ${images.length}`}
                    className="size-full object-cover"
                  />
                ) : null}
                {image.uploading ? (
                  <span className="bg-background/70 absolute inset-0 grid place-items-center">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    <span className="sr-only">Envoi en cours</span>
                  </span>
                ) : null}
                {index === 0 ? (
                  <span className="bg-primary text-primary-foreground absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                    <Star className="size-2.5" aria-hidden />
                    Couverture
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={`Retirer l'image ${index + 1}`}
                className="bg-background text-foreground hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-ring absolute -top-1.5 -right-1.5 rounded-full p-1 shadow-sm transition focus-visible:ring-2"
              >
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {remaining > 0 ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            onChange={(event) => void onFiles(event.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4" aria-hidden />
            {images.length === 0 ? "Ajouter des images" : `Ajouter (${remaining})`}
          </Button>
          <p className="text-muted-foreground mt-1 text-xs">
            Jusqu&apos;à {max} images. La première sert de couverture.
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" aria-live="polite" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
