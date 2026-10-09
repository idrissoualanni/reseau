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

export type AuthEnv = z.infer<typeof authEnvSchema>;
export type TurnstileEnv = z.infer<typeof turnstileEnvSchema>;

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
