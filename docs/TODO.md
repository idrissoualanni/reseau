# TODO — actions différées à ne pas oublier

> Fichier de rappel des actions volontairement reportées. Mis à jour le 2026-10-10.
> Quand une ligne est faite, la retirer d'ici ; l'historique reste dans `CHANGELOG.md` et
> `docs/prompt-loop/journal.md`.

## Auth & comptes (F01–F02)
- [ ] **Turnstile — EN ATTENTE.** Retiré temporairement (pas de domaine, pas de clés réelles).
  Créer un widget Cloudflare Turnstile dès qu'un domaine existe (Vercel staging + prod), puis
  renseigner `NEXT_PUBLIC_TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY`.
  - Dev sans domaine : clés de test officielles (réussite forcée, **dev uniquement**) —
    site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.
  - ⚠️ Une vraie clé secrète rejette le token factice, et inversement.
  - Réintroduire : `src/lib/actions/auth.ts` (action serveur) + `sign-up-form.tsx` (widget).
- [ ] **Domaines de confiance Neon Auth** : ajouter les origines staging + prod
  (console Neon ou `neon neon-auth domain add https://…`). `localhost` est pré-autorisé.
- [ ] **SMTP : utiliser `auth@mail.myneon.app` de Neon (développé uniquement)**
  Le SMTP partagé Neon est **rate-limited** : les codes OTP peuvent ne pas partir
  en cas de tests répétés. En dev vérifier les spams. Pour la production, prévoir
  un SMTP dédié (SendGrid, Mailgun, AWS SES) avant le déploiement V1.
- [x] **Code OTP non envoyé après inscription** : **corrigé** — `signUp.email` n'envoie
  rien (`verify_email_on_sign_up=false`), on appelle désormais explicitement
  `emailOtp.sendVerificationOtp` **même si le compte existe déjà** (cause du bug : second
  essai sur une adresse déjà créée → aucun code). Délai anti-spam de 60 s sur `/verify-email`.

## Render / déploiement
- [ ] **`render.yaml`** : mettre à jour via le MCP Render (service `reseau`).
- [ ] **Service `reseau`** (`srv-db4ek92jnfac73b4uij0`) : variables d'environnement de dev.
- [ ] **Supprimer le service `srv-db46e4btqb8s73e8bsd0`** (ancien, hors `reseau`).
- [ ] **Branche de déploiement** : ne JAMAIS déployer depuis `main` ; déployer depuis `dev`.
- [ ] **Fin de V1** : tests complets → déploiement Render dev + Neon dev → tester ce qui est
  réellement déployé (sondes de vérification), pas seulement le statut du build.

## Profil (F03/F04/F10) — reporté du Lot 2
- [x] **Avatar** : **fait (2026-10-10)** — upload présigné (bucket `profile`, clé
  `profiles/{profileId}/{uuid}.{ext}`, ≤ 5 Mo) + appartenance + `avatarUrl` exposé
  partout (profil, fil, commentaires, recherche, cartes de projets). Voir
  `docs/features/F13-avatar-profil.md`. (Repli initiales conservé.)
- [x] **Compétences pendant l'onboarding** : **décidé (2026-10-09)** — pas d'étape
  compétences à l'onboarding. Les compétences se gèrent sur `/me/profile` (le profil doit
  exister avant `user_skills`). L'étape « pendant l'onboarding » de F04 est différée.
- [ ] **Niveau `demonstrated`** : dérivation depuis les projets publiés, à brancher au
  Lot 3 (F05/F06), dans le cas d'usage publier/dépublier/supprimer.
- [x] **REST — durcissement** : **fait (2026-10-09)** — vérification de l'`Origin`
  (403 si cross-origin) + rate limiting en mémoire sur `POST/PATCH/DELETE /api/me/*`
  (10–30/min) et `GET /api/profiles/username-available` (20/min). Module
  `src/lib/api/security.ts`, tests `security.test.ts`. En prod multi-instances,
  remplacer par Redis (Render KV).

## Stockage / images (F06/F12)
- [x] **Convention** : **décidé (2026-10-09)** — Neon Object Storage (S3-compatible).
  Les variables `AWS_*` (`.env.local`) sont la convention réelle ; `.env.example`
  doit être aligné (`STORAGE_*` → `AWS_*`). Voir `docs/api/rest.md` § uploads.
- [x] **Bucket tranché** : **fait (2026-10-10)** — images de posts : bucket `post` en
  `public_read` ; clé `posts/{profileId}/{uuid}.{ext}` ; presign PUT 15 min ;
  `imageUrl` exposé (jamais `imageKey`). F12 terminé (voir `docs/features/F12-posts-images.md`).
- [x] **Avatars** : **fait (2026-10-10)** — bucket `profile`, clé `profiles/{profileId}/{uuid}.{ext}`,
  ≤ 5 Mo, F13 (voir `docs/features/F13-avatar-profil.md`).
- [ ] **Couvertures de projets** : brancher l'upload présigné (bucket `projet`, décision
  AGENTS.md 2026-10-10), Lot suivant. Le bucket `projet` reste **à créer** sur Neon
  (`public_read`) ; `storage.ts` route déjà les clés `projects/` vers ce bucket.

## Designer / UI
- [ ] **Sidebar** : ajouter une **icône de repli** (collapse) et un **dropdown** utilisateur
  dans le sidebar shadcn/ui (consigne AGENTS.md 2026-10-10).

## Clés encore vides (lots ultérieurs — non nécessaires à la V1)
- `NEXT_PUBLIC_GRAPHQL_URL` — Lot 3+ : `${NEXT_PUBLIC_APP_URL}/api/graphql`.
- `NEXT_PUBLIC_SIGNALING_URL`, `NEXT_PUBLIC_STUN_URL`, `TURN_URL`, `TURN_CREDENTIAL` — EN ATTENTE
  (WebRTC V1.5+) : à obtenir fournisseur TURN (Twilio, Cloudflare Calls ou coturn) et
  configurer dans `.env.local`. Non critique pour V1 ; reporter au Lot 3+.

## Outillage (fait)
- [x] **`drizzle-kit studio`** : **fait (2026-10-10)** — `drizzle.config.ts` charge
  `.env.local` via `process.loadEnvFile` (drizzle-kit ne le fait pas tout seul).
  `npx drizzle-kit studio` démarre Drizzle Studio (https://local.drizzle.studio).
- [x] **`schema.graphql`** : **fait (2026-10-10)** — export committé + scripts
  `graphql:export` / `graphql:check` (golden test, CI compare).
- [x] **Fusion F05/F06 → dev** : **fait (2026-10-10)** — `f05-f06-projects` mergé,
  worktree supprimé. Stubs cassés `projects/page.tsx` / `posts/page.tsx` supprimés.
- [x] **Fusion F07/F08 → dev** : **fait (2026-10-10)** — feed `/`, détail
  `/projects/[id]`, profil `/u/[username]`, domaine F08 public, 98 tests verts.

## Lots restants
- [x] **F09 — Recherche d'étudiants** (`/search`) : **fait (2026-10-10)** — worktree
  `f09-f10-search-edit` mergé dans `dev`. Repository (jointure + comptage + tri tuple),
  cas d'usage (normalisation, suggestions trigramme), API REST, page `/search` avec
  autocomplétion, curseur tuple, 109 tests verts.
- [x] **F11 — Posts et commentaires** : **fait (2026-10-10)** — worktree
  `f11-posts-comments`. Tables `posts` + `post_comments` (migrations 0003/0004
  appliquées sur Neon dev), GraphQL `posts/post(id)/createPost/deletePost/
  addComment/deleteComment`, actions serveur, pages `/posts` + `/posts/[id]`,
  commentaires imbriqués (indentation max 3 niveaux), suppressions en cascade,
  126 tests verts.

## À faire par l'utilisateur (nécessite son intervention)
- **Turnstile** : décider si clés de test dev ou attente domaine.
- **Bucket stockage** : nommer le bucket Neon Object Storage (ADR 0004 « proposé »).
- **TURN** : choisir le fournisseur pour WebRTC (V1.5+).
