import Script from "next/script";
import { turnstileEnabled, turnstileSiteKey } from "@/lib/env.client";

// Widget Cloudflare Turnstile (F01 règle 6). Rendu automatique : le script
// injecte un champ caché `cf-turnstile-response` lu par l'action serveur.
// Sans clé publique (développement), le widget n'est pas monté.
export function TurnstileWidget() {
  if (!turnstileEnabled) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="auto" />
    </>
  );
}
