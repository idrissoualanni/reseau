# ADR 0004 — Neon Storage et Cloudflare

- **Statut** : proposé · **Date** : 2026-10-08

## Contexte
Images (avatars, couvertures de projet) à stocker ; mobile et connexions faibles ; Cloudflare utilisé pour DNS/CDN/WAF.

## Décision
Fichiers dans **Neon Storage** (compatible S3), uploads par **URL présignée** directement depuis le navigateur. Cloudflare devant l'application ; mise en cache des images via Cloudflare **si** la compatibilité avec le bucket (domaine personnalisé ou bucket `public_read`) est confirmée.

## Alternatives écartées
Cloudflare R2 / Cloudinary — service supplémentaire alors que le stockage Neon existe déjà.

## Conséquences
- Maturité du stockage à vérifier dans la console (les sources divergent : préversion/bêta/GA).
- Accès derrière `lib/storage.ts` pour pouvoir migrer vers R2 si nécessaire.
- Buckets par branche Neon : dev et production sont isolés.
