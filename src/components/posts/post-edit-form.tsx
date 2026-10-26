"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
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
import { updatePostAction, type PostFormState } from "@/lib/actions/posts";
import { MAX_POST_BODY } from "@/lib/posts";
import { MAX_POST_IMAGE_BYTES } from "@/lib/validation/post";

const initialState: PostFormState = {};

type PresignResponse = { uploadUrl: string; key: string; expiresIn: number };

type PostEditFormProps = {
  post: { id: string; body: string; imageUrl: string | null };
};

export function PostEditForm({ post }: PostEditFormProps) {
  const [state, formAction, pending] = useActionState(updatePostAction, initialState);
  const [selected, setSelected] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
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
    setRemoved(false);
  }

  function removeImage() {
    setSelected(null);
    setPreviewUrl(null);
    setRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submitWithImage(formData: FormData) {
    if (selected) {
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
    } else if (removed) {
      formData.set("imageKey", "");
    }
    return formAction(formData);
  }

  const displayedImage = previewUrl ?? (removed ? null : post.imageUrl);

  return (
    <form action={submitWithImage} className="space-y-4">
      <input type="hidden" name="id" value={post.id} />

      {state.error ? (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}
      {uploadError ? (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {uploadError}
        </p>
      ) : null}

      <TextareaField
        name="body"
        label="Texte du post"
        defaultValue={post.body}
        placeholder="Partage une activité, une découverte, une question…"
        maxLength={MAX_POST_BODY}
        error={state.fieldErrors?.body}
        hint={`${MAX_POST_BODY} caractères maximum.`}
        rows={8}
        required
      />

      {displayedImage ? (
        <figure>
          <Attachment state="idle" className="w-full">
            <AttachmentMedia variant="image">
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local ou image publique */}
              <img src={displayedImage} alt="Image du post" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{selected?.name ?? "Image du post"}</AttachmentTitle>
              <AttachmentDescription>
                {selected ? "Nouvelle image" : "Image actuelle"}
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction type="button" onClick={removeImage} aria-label="Retirer l'image">
                <X />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        </figure>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => pickImage(event.target.files?.[0] ?? null)}
          className="sr-only"
          id="edit-post-image"
          aria-label="Choisir une image"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={pending}
        >
          <ImagePlus />
          {displayedImage ? "Changer d'image" : "Ajouter une image"}
        </Button>
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href={`/posts/${post.id}`}>Annuler</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </form>
  );
}
