# TODO — actions différées à ne pas oublier

> Fichier de rappel des actions volontairement reportées. Mis à jour le 2026-10-09.
> Quand une ligne est faite, la retirer d'ici ; l'historique reste dans `CHANGELOG.md` et
> `docs/prompt-loop/journal.md`.

## Auth & comptes (F01–F02)
- [ ] **Turnstile — vraies clés.** Créer un widget Cloudflare Turnstile dès qu'un domaine
  existe (Vercel staging + prod), puis renseigner dans chaque environnement
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY`.
  - Dev sans domaine : clés de test officielles (réussite forcée, **dev uniquement**) —
    site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.
  - ⚠️ Une vraie clé secrète rejette le token factice, et inversement.
- [ ] **Parcours complet manuel** : inscription → code OTP (boîte mail) → connexion →
  déconnexion, une fois Turnstile réel en place. Le socle et le proxy sont déjà vérifiés.
- [ ] **Domaines de confiance Neon Auth** : ajouter les origines staging + prod
  (console Neon ou `neon neon-auth domain add https://…`). `localhost` est pré-autorisé.
- [ ] **SMTP dédié en production** avant d'envoyer de vrais e-mails (checklist prod Neon).

## Render / déploiement
- [ ] **`render.yaml`** : mettre à jour via le MCP Render (service `reseau-dev`).
- [ ] **Service `reseau-dev`** : créer/configurer + variables d'environnement de dev.
- [ ] **Branche de déploiement** : ne JAMAIS déployer depuis `main` ; déployer depuis `dev`
  (créer une branche au moment du déploiement).
- [ ] **Fin de V1** : tests complets → déploiement Render dev + Neon dev → tester ce qui est
  réellement déployé (sondes de vérification), pas seulement le statut du build.

## Profil (F03/F04/F10) — reporté du Lot 2
- [ ] **Avatar** : affichage + upload présigné, une fois le stockage tranché (F06). En V1
  le profil naît avec l'initiale du nom affiché (`Avatar`, repli initiales).
- [ ] **Compétences pendant l'onboarding** : F04 prévoit une étape facultative à
  l'onboarding ; en V1 les compétences se gèrent sur `/me/profile` (le profil doit exister
  avant `user_skills`).
- [ ] **Niveau `demonstrated`** : dérivation depuis les projets publiés, à brancher au
  Lot 3 (F05/F06), dans le cas d'usage publier/dépublier/supprimer.
- [ ] **REST — durcissement** : vérification de l'`Origin` sur les mutations et limitation
  de débit sur `username-available` et `POST /api/me/skills` (voir `docs/api/rest.md`).

## Stockage / images (F06)
- [ ] Réconcilier `.env.example` (`STORAGE_*`) et `.env.local` (`AWS_*`) : Neon Object Storage
  est S3-compatible, garder une seule convention.
- [ ] Trancher le bucket : privé `asset` vs public `images` (+ `STORAGE_PUBLIC_BASE_URL`).

## Clés encore vides (lots ultérieurs — non nécessaires à la V1)
- `NEXT_PUBLIC_GRAPHQL_URL` — Lot 3+ : `${NEXT_PUBLIC_APP_URL}/api/graphql`.
- `NEXT_PUBLIC_SIGNALING_URL`, `NEXT_PUBLIC_STUN_URL`, `TURN_URL`, `TURN_CREDENTIAL` — V1.5+
  (messagerie / WebRTC) : fournisseur TURN (Metered, Twilio, Cloudflare Calls) ou coturn.

## Boucle de prompts / outillage
- [ ] **Plugin de boucle** : ajouter une demande d'autorisation de lancement, activable par la
  commande `/loop` (`.opencode/plugins/prompt-loop/`, gitignoré).
- [ ] **Expliquer le fonctionnement des hooks** d'après la documentation OpenCode
  (cycle de vie, où ils vivent, `PreToolUse`/`PostToolUse`/`SessionStart`).
