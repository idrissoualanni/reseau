import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getStorageEnv } from "@/lib/env";

// Seule porte d'entrée vers le stockage de fichiers (architecture §11), Neon
// Object Storage (compatible S3). Buckets `post` et `profile` = public_read
// (F12/F13) : lecture anonyme, écriture authentifiée. Accès dégradé si les
// clés `AWS_*` manquent : aucune URL renvoyée plutôt qu'une erreur au build.

const POST_IMAGE_BUCKET = "post";
const PROFILE_AVATAR_BUCKET = "profile";
const PROJECT_IMAGE_BUCKET = "projet";

let s3: S3Client | undefined;

// Client paresseux : construit seulement quand les clés `AWS_*` sont valides.
function getS3(): S3Client {
  if (!s3) {
    const env = getStorageEnv();
    s3 = new S3Client({
      region: env.AWS_REGION,
      endpoint: env.AWS_ENDPOINT_URL_S3,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true, // requis : Neon utilise le path-style
    });
  }
  return s3;
}

// Bucket d'une clé selon son préfixe : posts → `post`, projects → `projet`,
// profiles (avatars) → `profile`.
function bucketForKey(key: string): string {
  if (key.startsWith("posts/")) return POST_IMAGE_BUCKET;
  if (key.startsWith("projects/")) return PROJECT_IMAGE_BUCKET;
  return PROFILE_AVATAR_BUCKET;
}

// URL publique d'une clé (bucket public_read), ou `null` si stockage absent.
export function getPublicUrl(key: string): string | null {
  if (!key) return null;
  let env;
  try {
    env = getStorageEnv();
  } catch {
    return null;
  }
  return `${env.AWS_ENDPOINT_URL_S3}/${bucketForKey(key)}/${key}`;
}

// Clé de stockage d'une couverture de projet : `projects/{profileId}/...`.
export function projectCoverPrefix(profileId: string): string {
  return `projects/${profileId}/`;
}

// Clé de stockage d'une image de post : `posts/{profileId}/...`.
export function postImagePrefix(profileId: string): string {
  return `posts/${profileId}/`;
}

// Clé de stockage d'un avatar : `profiles/{profileId}/...`.
export function avatarPrefix(profileId: string): string {
  return `profiles/${profileId}/`;
}

// URL présignée PUT pour uploader une image de post (F12). Le navigateur
// écrit directement dans le bucket ; le contenu ne transite pas par l'API.
export async function presignPostImageUpload(
  key: string,
  contentType: string,
  expiresIn = 900,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: POST_IMAGE_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getS3(), command, { expiresIn });
}

// URL présignée PUT pour uploader un avatar (F13). Même mécanisme que F12.
export async function presignAvatarUpload(
  key: string,
  contentType: string,
  expiresIn = 900,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: PROFILE_AVATAR_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getS3(), command, { expiresIn });
}

// URL présignée PUT pour uploader une couverture de projet (F06). Le bucket
// `projet` est public_read : lecture anonyme, écriture authentifiée présignée.
export async function presignProjectCoverUpload(
  key: string,
  contentType: string,
  expiresIn = 900,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: PROJECT_IMAGE_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getS3(), command, { expiresIn });
}