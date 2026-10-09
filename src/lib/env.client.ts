// Variables **publiques** (préfixe NEXT_PUBLIC_, inlinées par Next au build).
// Aucun secret ici : ce module peut être importé par un composant client.
export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

// Sans clé publique, le widget anti-robot n'est pas monté (développement local).
export const turnstileEnabled = turnstileSiteKey.length > 0;
