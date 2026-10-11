import { z } from "zod";

// Seule porte d'entrée serveur vers `process.env` (architecture §14).
// Validation **paresseuse** : le build ne doit pas exiger les secrets ; la
// première requête qui en a besoin lève une erreur claire si elle manque.
// Deux groupes indépendants : l'auth protège le proxy, Turnstile ne pèse que
// sur les actions d'inscription / réinitialisation.
const authEnvSchema = z.object({
  NEON_AUTH_BASE_URL: z.url(),
  NEON_AUTH_COOKIE_SECRET: z
    .string()
    .min(32, "NEON_AUTH_COOKIE_SECRET doit faire au moins 32 caractères."),
});

const turnstileEnvSchema = z.object({
  TURNSTILE_SECRET_KEY: z.string().min(1),
});

// Stockage Neon Object Storage (F12) : clés `AWS_*`, inversion de dépendance
// vers `lib/storage.ts`. Validation paresseuse : absent hors upload.
const storageEnvSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_ENDPOINT_URL_S3: z.url(),
});

// Amorçage du rôle `platform_admin` (F16) : liste d'e-mails séparés par des
// virgules. Facultatif — en son absence, seuls les admins en base comptent.
const adminEnvSchema = z.object({
  PLATFORM_ADMIN_EMAILS: z.string().optional(),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;
export type TurnstileEnv = z.infer<typeof turnstileEnvSchema>;
export type StorageEnv = z.infer<typeof storageEnvSchema>;

function parseOrThrow<T>(schema: z.ZodType<T>, label: string): T {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Configuration ${label} manquante ou invalide : ${names}.`);
  }
  return parsed.data;
}

let authEnv: AuthEnv | undefined;

export function getAuthEnv(): AuthEnv {
  authEnv ??= parseOrThrow(authEnvSchema, "d'authentification");
  return authEnv;
}

let turnstileEnv: TurnstileEnv | undefined;

export function getTurnstileEnv(): TurnstileEnv {
  turnstileEnv ??= parseOrThrow(turnstileEnvSchema, "anti-robot");
  return turnstileEnv;
}

let storageEnv: StorageEnv | undefined;

export function getStorageEnv(): StorageEnv {
  storageEnv ??= parseOrThrow(storageEnvSchema, "de stockage");
  return storageEnv;
}

// E-mails autorisés à l'amorçage du rôle plateforme, en minuscules.
let platformAdminEmails: Set<string> | undefined;

export function getPlatformAdminEmails(): Set<string> {
  platformAdminEmails ??= new Set(
    (parseOrThrow(adminEnvSchema, "d'administration").PLATFORM_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0),
  );
  return platformAdminEmails;
}
