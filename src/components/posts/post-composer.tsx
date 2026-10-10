"use client";

import { useActionState, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/textarea-field";
import {
  createPostAction,
  type PostFormState,
} from "@/lib/actions/posts";
import { MAX_POST_BODY } from "@/lib/posts";
import { MAX_POST_IMAGE_BYTES } from "@/lib/validation/post";

const initialState: PostFormState = {};

type PresignResponse = { uploadUrl: string; key: string; expiresIn: number };

// Champ de publication d'un post (F11) : texte brut, max 5000 caractères.
// F12 : une image optionnelle est PUT vers une URL présignée Neon avant la
// publication ; le contenu ne transite jamais par l'API applicative.
export function PostComposer() {
  const [state, formAction, pending] = useActionState(createPostAction, initialState);
  const [selected, setSelected] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickImage(file: File | null) {
    setUploadError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Format d'image non supporté.");
      return;
    }
    if (file.size > MAX_POST_IMAGE_BYTES) {
      setUploadError("Image trop lourde (10 Mo maximum).");
      return;
    }
    setSelected(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function presignAndPublish(formData: FormData) {
    if (!selected) return formAction(formData);
    try {
      const res = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "post-image",
          contentType: selected.type,
          size: selected.size,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "L'upload a échoué.");
      }
      const { uploadUrl, key } = (await res.json()) as PresignResponse;
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selected.type },
        body: selected,
      });
      if (!put.ok) throw new Error("L'upload de l'image a échoué.");
      formData.set("imageKey", key);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Une erreur est survenue.");
      return;
    }
    return formAction(formData);
  }

  return (
    <form action={presignAndPublish} className="space-y-3">
      {state.error ? (
        <p
          role="alert"
          aria-live="polite"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      ) : null}
      {uploadError ? (
        <p
          role="alert"
          aria-live="polite"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {uploadError}
        </p>
      ) : null}

      {previewUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local avant upload */}
          <img
            src={previewUrl}
            alt="Aperçu de l'image du post"
            className="bg-surface max-h-64 w-full rounded-[14px] object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelected(null);
              setPreviewUrl(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            aria-label="Retirer l'image"
            className="absolute top-2 right-2"
          >
            <X />
          </Button>
        </div>
      ) : null}

      <TextareaField
        name="body"
        label="Quoi de neuf ?"
        placeholder="Partage une activité, une découverte, une question…"
        maxLength={MAX_POST_BODY}
        error={state.fieldErrors?.body}
        hint={`${MAX_POST_BODY} caractères maximum.`}
        rows={4}
      />

      <div className="flex items-center justify-between gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => pickImage(event.target.files?.[0] ?? null)}
          className="sr-only"
          id="post-image"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={pending}
        >
          <ImagePlus />
          Ajouter une image
        </Button>
        <Button type="submit" disabled={pending || (!selected && false)}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {pending ? "Publication…" : "Publier"}
        </Button>
      </div>
    </form>
  );
}