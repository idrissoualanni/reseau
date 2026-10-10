"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { updateAvatarAction } from "@/lib/actions/profile";
import { MAX_AVATAR_IMAGE_BYTES } from "@/lib/validation/image";

type PresignResponse = { uploadUrl: string; key: string; expiresIn: number };

// Upload présigné de l'avatar (F13) : le navigateur PUT le fichier directement
// dans le bucket `profile`, puis une action serveur enregistre la clé. Le
// contenu ne transite jamais par l'API applicative.
export function AvatarUploader({ displayName, avatarUrl }: { displayName: string; avatarUrl: string | null }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pickImage(file: File | null) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Format d'image non supporté.");
      return;
    }
    if (file.size > MAX_AVATAR_IMAGE_BYTES) {
      setError("Image trop lourde (5 Mo maximum).");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    startTransition(async () => {
      try {
        const res = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "profile-avatar", contentType: file.type, size: file.size }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message ?? "L'upload a échoué.");
        }
        const { uploadUrl, key } = (await res.json()) as PresignResponse;
        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!put.ok) throw new Error("L'upload de l'image a échoué.");
        const result = await updateAvatarAction(key);
        if (!result.ok) throw new Error(result.error);
        router.refresh();
      } catch (err) {
        setPreviewUrl(null);
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  function removeAvatar() {
    setError(null);
    startTransition(async () => {
      const result = await updateAvatarAction(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreviewUrl(null);
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="avatar-heading" className="flex flex-col gap-3">
      <h2 id="avatar-heading" className="text-lg font-semibold">
        Photo de profil
      </h2>

      {error ? (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-4">
        <Avatar name={displayName} src={previewUrl ?? avatarUrl} size="lg" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => pickImage(event.target.files?.[0] ?? null)}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Upload />}
            Changer
          </Button>
          {avatarUrl ? (
            <Button type="button" variant="ghost" onClick={removeAvatar} disabled={pending}>
              <Trash2 />
              Retirer
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Image JPEG, PNG, WebP ou GIF, 5 Mo maximum.
      </p>
    </section>
  );
}