import { z } from "zod";

// Whitelist des images partagée entre posts (F12) et avatars (F13).
export const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];

export const imageContentTypeSchema = z.enum(IMAGE_CONTENT_TYPES, {
  message: "Format d'image non supporté.",
});

// Plafonds : post 10 Mo (F12), avatar 5 Mo (photo de profil).
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_AVATAR_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<ImageContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Extension de fichier à partir du MIME (clé `{préfixe}/{uuid}.{ext}`).
export function imageExtension(contentType: ImageContentType): string {
  return IMAGE_EXTENSIONS[contentType];
}