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

## Console admin (V1.5) — journal OTP + garde e-mail
- [x] **Visibilité des OTP — décision (2026-10-13)** : avec Neon Auth (Managed Better
  Auth), le code n'est **jamais** reçu par l'app ; l'exposer est impossible. Retenu :
  **option A** — page admin `/admin/otp` listant les **envois** (adresse, type, date,
  succès/échec), **jamais le code**. Options « SMTP custom + boîte dev » et « sortir de
  l'auth managée » écartées pour l'instant (voir `docs/backlog.md`).
- [ ] **Appliquer la migration `0008_auth_otp_audit.sql`** sur Neon **dev** :
  `npm run db:migrate` — **bloqué** tant que `node_modules` est vide (disque plein).
  Le SQL est additif et déjà écrit. Ensuite : `npm test` (dont tests audit/mapper).
- [ ] **Vérifier la garde de vérification d'e-mail** en conditions réelles (compte
  non vérifié → `/verify-email`) — **intervention utilisateur** : libérer l'espace disque
  (~1 Go) puis `npm install`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

## Render / déploiement
- [x] **`render.yaml`** : **aligné (2026-10-11)** via MCP Render — service `reseau`
  (srv-db4ek92jnfac73b4uij0), `NEXT_PUBLIC_APP_URL` = `fromService.publicUrl`,
  stockage `AWS_*`. Secrets restent `sync: false` (dashboard).
- [ ] **Service `reseau`** (`srv-db4ek92jnfac73b4uij0`) : renseigner les secrets en dev
  (`DATABASE_URL`, `NEON_AUTH_*`, `AWS_*`) — **intervention utilisateur**. La clé Render
  n'est jamais écrite : `{file:.secrets/render-api-key}` (gitignoré).
- [x] **Env dev corrigé (2026-10-10)** : `NEXT_PUBLIC_APP_URL` valait `http://localhost:3000`
  → **403 sur toutes les mutations** (`/api/uploads/presign`, `/api/me/*`, GraphQL), vérifié via
  l'API Render. Remis à `https://reseau-3tuk.onrender.com` ; `NEXT_PUBLIC_GRAPHQL_URL` renseigné
  (`https://reseau-3tuk.onrender.com/api/graphql`). Rebuild dev déclenché (les `NEXT_PUBLIC_*`
  sont inlinées au build).
- [ ] **Supprimer le service `srv-db46e4btqb8s73e8bsd0`** (ancien, hors `reseau`).
- [ ] **Branche de déploiement** : ne JAMAIS déployer depuis `main` ; déployer depuis `dev`.
- [ ] **Push de `dev` bloqué** : la config OpenCode globale (`~/.config/opencode/opencode.jsonc`,
  ligne 48) refuse `git push *` (`effect: deny`). `dev` = `86e0b09`, en avance de 9 commits sur
  `origin/dev`. **Intervention utilisateur** : autoriser `git push` (ou pousser `dev` manuellement)
  pour déclencher le déploiement Render dev.
- [x] **V1 — code vérifié (2026-10-11)** : `npm run build` (26/26 pages), `tsc --noEmit`
  (0 erreur), `npm run lint` (0 erreur), `npm test` (**150/150 verts**). Toutes les branches
  sont contenues dans `dev`.
- [ ] **Fin de V1** : déploiement Render dev + Neon dev → tester ce qui est
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
- [x] **Convention** : **décidé (2026-10-09), aligné (2026-10-11)** — Neon Object Storage
  (S3-compatible), variables `AWS_*` (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  `AWS_REGION`, `AWS_ENDPOINT_URL_S3`). `.env.example` et `render.yaml` alignés ;
  buckets `post` / `projet` / `profile` (voir `src/lib/storage.ts`).
- [x] **Bucket tranché** : **fait (2026-10-10)** — images de posts : bucket `post` en
  `public_read` ; clé `posts/{profileId}/{uuid}.{ext}` ; presign PUT 15 min ;
  `imageUrl` exposé (jamais `imageKey`). F12 terminé (voir `docs/features/F12-posts-images.md`).
- [x] **Avatars** : **fait (2026-10-10)** — bucket `profile`, clé `profiles/{profileId}/{uuid}.{ext}`,
  ≤ 5 Mo, F13 (voir `docs/features/F13-avatar-profil.md`).
- [x] **Buckets Neon vérifiés (2026-10-10)** : `post`, `profile`, **`projet`** (tous `public_read`),
  `asset` (privé). Endpoint dev = `https://br-jolly-pine-b50wjyjx.storage.c-7.us-east-2.aws.neon.tech`,
  région `us-east-2`, `force_path_style: true`. Aligné avec `AWS_*` en local et sur Render.
- [x] **Couvertures de projets** : **fait (2026-10-11)** — upload présigné branché (bucket
  `projet`, kind `project-cover`, clé `projects/{profileId}/{uuid}.{ext}`, ≤ 5 Mo) ;
  création F05 + édition F06 ; aperçu + retrait ; tests de validation. Mergé sur `dev`.

## Designer / UI
- [x] **Ergonomie des posts** : **fait (2026-10-11)** — fil groupé par jour, hiérarchie de la
  carte de post, composition sur page dédiée `/posts/new`, aperçu image fidèle, mise en
  évidence du post publié (ancre `#post-<id>`). Aucune migration, aucune API modifiée.
  Worktree `posts-ux` → `dev`. Voir `docs/ux/posts.md`, `docs/features/F11-posts.md`, `F12`.
- [x] **Sidebar** : **fait (2026-10-11)** — icône de repli (collapse) + dropdown utilisateur
  dans le sidebar shadcn/ui, lien « Posts » aligné sur `NAV_ITEMS` (source unique).
  Mergé sur `dev` (commit `4998a98`).
- [x] **Lien « Posts » manquant (2026-10-10)** : le sidebar (`src/components/app-sidebar.tsx`)
  n'affiche pas `/posts` (liste locale désalignée de `src/components/navigation.ts`). À aligner
  sur `NAV_ITEMS` (source unique) — traité dans la refonte du sidebar.

## Clés encore vides (lots ultérieurs — non nécessaires à la V1)
- `NEXT_PUBLIC_GRAPHQL_URL` — **fait (2026-10-10)** : `https://reseau-3tuk.onrender.com/api/graphql`
  (local + Render). ⚠️ `.env.local` n'interpole pas `${...}` : ne jamais écrire
  `${NEXT_PUBLIC_APP_URL}/...` (valeur littérale cassée).
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
- [x] **Fichiers de test alignés (2026-10-11)** — agent QA (`.claude/agents/qa.md`,
  `.opencode/agents/qa.md`), rule `testing` (`.claude/rules/testing.md` + miroir
  `.opencode/rules/testing.md`), skill `vitest-testing` et commande `/test`. Vitest
  uniquement, intégration **hors ligne** (`*.integration.test.ts`), `npx next typegen`
  avant `typecheck`, base réelle en opt-in sur la branche **dev**.

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

## V1.5 — Administration plateforme (worktree `v1.5-admin`)
- [x] **F14 socle espaces, F16 rôles, F17 console plateforme** : **livré (2026-10-11)** —
  schéma (`spaces`, `space_access_methods`, `memberships`, `space_access_log`),
  cas d'usage `src/lib/admin.ts`, REST `/api/admin/*` + espaces publics, console `/admin/*`,
  lien sidebar conditionnel. Fiches `docs/features/F14`, `F16`, `F17`, `docs/ux/admin-plateforme.md`.
- [x] **Accès admin par rôle Neon Auth (2026-10-11)** — `platform_admins` supprimée ;
  `requirePlatformAdmin` et `/admin` reposent sur `session.user.role` (`admin`). Routes/page/
  onglet admins retirés, `PLATFORM_ADMIN_EMAILS` supprimé. Tests/lint/typecheck verts.
- [x] **Tests d'intégration posts/commentaires + garde admin (2026-10-11)** — worktree
  `v1.5-integration` mergé (+18 tests, **189 verts**). Deux correctifs GraphQL :
  `addComment` racine (`parentId: null`, Zod v4 refuse `undefined`) et `Post.comments`
  ne renvoie que les racines (les réponses sont sous `replies`). Écart noté :
  front posts hors GraphQL (`docs/backlog.md`).
- [x] **Migrations V1.5 appliquées sur Neon dev** : `0006` (tables V1.5), puis `0007`
  (drop `platform_admins`). Vérifié via MCP : `__drizzle_migrations.apply_count = 8`,
  `platform_admins` absente. La `0007` est destructive : ne pas la rejouer ailleurs sans relecture.
- [x] **`PLATFORM_ADMIN_EMAILS` supprimé** (2026-10-11) — remplacé par le rôle `admin`
  de Neon Auth. Aucun amarrage applicatif ni variable d'environnement nécessaire.
- [ ] **F15 — rejoindre un espace + console d'espace (reste de F17)** : **code écrit
  (worktree `v15-espaces`), NON vérifié** — accès `open`/`invite_code`/`invite_link`/
  `manual_approval`, approbation/refus/retrait des membres, configuration des méthodes,
  pages publiques `/spaces` + `/spaces/[slug]`, onglets console Membres/Accès.
  ⚠️ **À vérifier dès que le disque le permet** : `npm ci` puis `npm test`, `npm run lint`,
  `npm run typecheck`, `npm run build` (bloqués : ~150 Mo libres, `node_modules` absent).
  Restent hors périmètre : modération d'espace (F20) et page dédiée `space_admin` hors
  `/admin` plateforme (voir `docs/backlog.md`).
- [ ] **Comptes (infos de connexion + suppression)** : l'API admin Better Auth exige une
  **clé serveur** (l'accès `/admin` par rôle ne suffit pas côté serveur).
  **Intervention utilisateur** : fournir la clé serveur.

## À faire par l'utilisateur (nécessite son intervention)
- ⚠️ **Sécurité — cookie de session exposé** : le cookie `__Secure-neon-auth.*` a été collé en
  clair dans `AGENTS.md` (WIP non commité). À retirer du fichier ; considérer la session comme
  compromise (se déconnecter/reconnecter). Ne jamais committer `AGENTS.md` avec ce contenu.
- **Render** : supprimer le service `srv-db46e4btqb8s73e8bsd0` (le dev utilise
  `srv-db4ek92jnfac73b4uij0`).
- **Turnstile** : décider si clés de test dev ou attente domaine.
- **Bucket stockage** : nommer le bucket Neon Object Storage (ADR 0004 « proposé »).
- **TURN** : choisir le fournisseur pour WebRTC (V1.5+).
- **Admin plateforme** : attribuer le rôle `admin` dans la console Neon Auth (déjà fait pour
  `alanniidrissou4@gmail.com`). Aucune variable à poser.
- **Comptes / suppression** : fournir une **clé serveur** Better Auth pour débloquer la lecture
  des identifiants et la suppression de compte (F17).
- **OTP admin (proposé)** : permettre à l'admin de voir les codes OTP envoyés aux
  utilisateurs — à cadrer (voir `docs/backlog.md`).
