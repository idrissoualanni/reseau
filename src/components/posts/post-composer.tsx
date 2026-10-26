"use client";

import { useActionState, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { TextareaField } from "@/components/textarea-field";
import { createPostAction, type PostFormState } from "@/lib/actions/posts";
import { MAX_POST_BODY } from "@/lib/posts";
import { MAX_POST_IMAGE_BYTES } from "@/lib/validation/post";

const initialState: PostFormState = {};

type PresignResponse = { uploadUrl: string; key: string; expiresIn: number };

// Composition d'un post (F11) sur sa page dédiée : texte brut (max 5000),
// image optionnelle (F12) PUT vers une URL présignée Neon avant publication.
// L'aperçu reprend le cadrage du fil pour montrer le rendu final (F12 règle 8).
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

  function clearImage() {
    setSelected(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    <form action={presignAndPublish} className="space-y-4">
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

      <TextareaField
        name="body"
        label="Quoi de neuf ?"
        placeholder="Partage une activité, une découverte, une question…"
        maxLength={MAX_POST_BODY}
        error={state.fieldErrors?.body}
        hint={`${MAX_POST_BODY} caractères maximum.`}
        rows={8}
      />

      {previewUrl ? (
        <figure className="space-y-2">
          <Attachment state="idle" className="w-full">
            <AttachmentMedia variant="image">
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local avant upload */}
              <img src={previewUrl} alt="Aperçu de l'image du post" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{selected?.name ?? "Image du post"}</AttachmentTitle>
              <AttachmentDescription>Image jointe · 10 Mo maximum</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction type="button" onClick={clearImage} aria-label="Retirer l'image">
                <X />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
          <figcaption className="text-muted-foreground text-xs">
            L&apos;image apparaîtra sous le texte dans le fil.
          </figcaption>
        </figure>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => pickImage(event.target.files?.[0] ?? null)}
          className="sr-only"
          id="post-image"
          aria-label="Choisir une image"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={pending}
        >
          <ImagePlus />
          {selected ? "Changer d'image" : "Ajouter une image"}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {pending ? "Publication…" : "Publier"}
        </Button>
      </div>
    </form>
  );
}
