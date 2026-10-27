# TODO — actions différées à ne pas oublier

> Fichier de rappel des actions volontairement reportées. Mis à jour le 2026-10-21.
> Quand une ligne est faite, la retirer d'ici ; l'historique reste dans `CHANGELOG.md` et
> `docs/prompt-loop/journal.md`.

## Sécurité — clés et secrets
- [ ] **Rotation de la clé API Neon** — la clé MCP a été affichée en clair dans la
  conversation du 2026-10-26 (divulgation). **Intervention utilisateur** : régénérer la
  clé dans la console Neon, puis mettre à jour la variable d'environnement utilisateur
  `NEON_API_KEY` et reconnecter le MCP. La config OpenCode ne contient plus la valeur
  (`Bearer {env:NEON_API_KEY}`), règle : `.opencode/rules/secrets.md`.
- [ ] **Suppression des branches distantes mergées** (`v1.5-projects-db`, `-api`, `-ui`) :
  commande refusée par les permissions de l'agent. **Intervention utilisateur** :
  `git push origin --delete v1.5-projects-db v1.5-projects-api v1.5-projects-ui`
  (commits déjà dans `dev`).

## V2 — temps réel et messagerie (en cours, 2026-10-26)

- [x] **Neon Realtime activé sur `dev`** : origines autorisées
  `http://localhost:3000` et `https://reseau-3tuk.onrender.com`. Preuve : abonnement
  à une table de test, snapshot vide, insertion, réception de la ligne, table supprimée.
- [x] **Variables `NEON_REALTIME_URL` / `NEON_REALTIME_SECRET`** présentes dans
  `.env.local` (noms vérifiés, valeurs jamais affichées). `NEON_REALTIME_SECRET`
  reste **serveur uniquement**.
- [x] **Déclaration `neon.ts`** : buckets `asset`, `post`, `profile`, `projet`,
  `videos` + `preview.realtime` avec les deux origines. Ne pas lancer
  `neon config apply` avant que l'état live et le fichier soient alignés.
- [ ] **Render dev — variables Realtime** — **intervention utilisateur** : ajouter
  `NEON_REALTIME_URL` et `NEON_REALTIME_SECRET` au service `reseau`
  (`srv-db4ek92jnfac73b4uij0`). Ne jamais coller le secret dans un ticket, un log ou
  la conversation.
- [ ] **Fonction de saisie/présence** : contrat WebSocket, jeton court, TTL, limites.
  Aucun événement persisté.
- [x] **Schéma messagerie** : conversations, participants, messages, réactions,
  accusés, clés publiques, clés de conversation enveloppées. Migration additive
  `0011_v2_messaging.sql` appliquée et vérifiée sur Neon `dev` (7 tables).
- [x] **Crypto E2E client** : ECDH P-256 + HKDF + AES-256-GCM, clé privée IndexedDB,
  aucun recouvrement en V2.
- [x] **UI messagerie** : `/messages`, liste de conversations, fil, saisie, réactions,
  pagination, aperçus déchiffrés côté client. Restent la saisie/présence temps réel.
- [ ] **Galerie de 5 images (posts et projets)** — fait en V1.5 : `image_keys`
  (migration 0012), `GalleryUploader` + `ImageGallery`, `imageUrls` GraphQL,
  tests `src/lib/galleries.test.ts`. Reste à vérifier dans le navigateur connecté.
- [ ] **Galerie 5 images** : posts et projets, première image = couverture, carrousel.
- [ ] **Séparation admin** : route group et modules serveur dédiés, gardes API.
- [ ] **Vérification navigateur authentifiée** des parcours V1.5/V2 — **intervention
  utilisateur** (session réelle).
- [ ] **Rotation du secret Realtime** si `NEON_REALTIME_SECRET` a été affiché :
  `neon realtime rotate-secret`, puis mise à jour Render et `.env.local`.
- [ ] **Blocage / signalement** : hors V2, à examiner en V2.5 (`docs/backlog.md`).
- [ ] **Pièces jointes de messagerie** : hors V2, à examiner en V2.5.

## Contenu V1.5 — livré (2026-10-26)
- [x] `post_likes` + `togglePostLike` + `likeCount`/`hasLiked`.
- [x] Édition/suppression des posts, `/me/posts`, `/posts/[id]/edit`.
- [x] `attachment` pour les images de post, `badge` pour brouillon/publié.
- [x] Type de projet éditable + filtres `/me/projects`.
- [x] Hub `/me/profile` (projets, posts, brouillons) + `/me/profile/edit`.
- [x] Posts sur le profil public et navigation « Mon profil » vers `/u/{username}`.
- [ ] **Vérification navigateur authentifiée** des parcours ci-dessus sur le dev Render
  — **intervention utilisateur** (session réelle).
- [x] **`0010_post_likes.sql` appliquée sur Neon dev** (2026-10-26) : table
  `post_likes` créée, contrainte `project_updates_body_check` passée à 0–5000,
  migration enregistrée dans `drizzle.__drizzle_migrations`.

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
- [x] **Migration `0008_auth_otp_audit.sql` sur Neon dev** : **appliquée (2026-10-21)** —
  `drizzle-kit migrate` ne persiste pas sur Neon (driver `@neondatabase/serverless`) : appliquée
  via **MCP Neon** (`run_sql_transaction`, SQL additif `IF NOT EXISTS`) puis enregistrée dans
  `drizzle.__drizzle_migrations` (hash SHA-256 `7e62e5f8…`, `created_at` epoch ms).
  Vérifié : 9 migrations, table `auth_otp_audit` (6 colonnes) + index `created_idx` / `email_idx`.
- [ ] **Vérifier la garde de vérification d'e-mail** en conditions réelles (compte
  non vérifié → `/verify-email`) — **intervention utilisateur** : tester sur le dev déployé.
  La vérification **locale** est faite (2026-10-21) : voir « V1/V1.5 — code vérifié » plus bas.
- [ ] **Prouver la forme de `session.user`** (`emailVerified`) sur une session d'inscription :
  la garde est **fail-open** ; si le champ est absent, elle est inerte. À confirmer en dev.
- [ ] **Définir une rétention/purge pour `auth_otp_audit`** (ex. 30–90 j) — exigé par la
  revue `securite` et `donnees-personnelles.md` (exception tracée dans `security.md`).
- [x] **MCP Render hors service** : clé API **régénérée** (2026-10-26). L'API REST Render
  fonctionne avec `{file:.secrets/render-api-key}` (services, deploys et logs vérifiés).
- [ ] **Reconnecter le MCP Render** dans OpenCode avec la nouvelle clé — **intervention
  utilisateur** (le MCP renvoie encore `unauthorized` dans la session en cours).

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
- [x] **Service `srv-db46e4btqb8s73e8bsd0` supprimé** (vérifié 2026-10-26 : API Render → 404).
- [ ] **`schema.graphql` désynchronisé** : le golden file n'inclut pas les types V1.5
  (réactions/commentaires projet) ni les j'aime de posts. Régénérer avec
  `npm run graphql:export` après installation des dépendances, puis relancer
  `npm run graphql:check`.
- [ ] **Branche de déploiement** : ne JAMAIS déployer depuis `main` ; déployer depuis `dev`.
- [x] **Push de `dev`** : **synchronisé (2026-10-21)** — `git status -sb` = `dev...origin/dev`
  avec **0 commit en attente** (`242916a`), 3 branches (`admin-console`, `v1.5-admin-role`,
  `v15-espaces`) entièrement contenues dans `dev`. Le `effect: deny` sur `git push *` de la
  config OpenCode globale peut rester actif : si un prochain push est refusé, **intervention
  utilisateur** (autoriser `git push` ou pousser manuellement).
- [x] **V1 — code vérifié (2026-10-11)** : `npm run build` (26/26 pages), `tsc --noEmit`
  (0 erreur), `npm run lint` (0 erreur), `npm test` (**150/150 verts**). Toutes les branches
  sont contenues dans `dev`.
- [x] **V1/V1.5 — revérifié (2026-10-21)** après reprise d'une session interrompue :
  `npm install` (708 paquets), `npm run lint` (0 erreur), `npx next typegen` +
  `npm run typecheck` (0 erreur), `npm test` (**242 verts / 4 skipped**),
  `npm run build` (OK). Blocage levé : `node_modules` était vide (0 entrée).
- [x] **Fin de V1 — déployé et sondé (2026-10-26)** : commit `e0f2d5f`, deploy
  `dep-dbfragff3r2c73avpo3g` **live** sur `srv-db4ek92jnfac73b4uij0`. Sondes :
  `/api/health` 200 + `database:true`, `POST /api/graphql` 200 (`{ __typename }`),
  `/sign-in` et `/sign-up` 200. Pages protégées sans session → page de connexion.
  Tests/lint locaux non exécutés (disque plein, `node_modules` absent) : le build
  Render et les sondes sont les seules preuves.
- [ ] **Disque `C:` saturé** (2026-10-26 : ~200 Mo libres, `node_modules` absent) —
  `~/.local/share/opencode/opencode.db` pèse 2,5 Go. **Intervention utilisateur** :
  libérer de l'espace, puis `npm ci` pour exécuter `npm test` et `npm run lint`
  localement. Le script `.opencode/scripts/cleanup-disk.sh` ne nettoie que caches/temp.

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
- [x] **Buckets Neon vérifiés (2026-10-26)** : `asset`, `post`, `profile`, `projet`,
  `videos` présents. Objets `post`, `profile` et `projet` servis en **HTTP 200**
  (public_read) ; endpoint S3 path-style aligné avec `AWS_*` local et Render.
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
- [~] **`schema.graphql`** : export et scripts `graphql:export` / `graphql:check`
  existent ; le golden file est **périmé** pour les types V1.5 et les j'aime de posts.
  Régénération à faire après `npm ci` (voir section Render).
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

## V1.5 — Fonctionnalités projets (F18/F19/F20) — **LOCAL DONE (2026-10-25)**
- [x] **Base de données** : migration `0009_v15_project_features.sql` appliquée sur Neon dev
  (types `project_type_enum`, `project_reaction_type_enum`, tables `project_reactions`,
  `project_comments`, `project_followers`, `project_updates`, indexes partiels + trigramme)
- [x] **Backend GraphQL** : queries `projectsV15`, mutations 8 (reactions, comments, follow, updates),
  DataLoaders pour reactions/comments/followers/updates, schémas validés
- [x] **Frontend UI** : `ProjectTabs` (4 onglets), `ProjectReactions` (4 types), `ProjectComments`
  (imbriqués 3 niveaux), `ProjectFollowers`, `ProjectActivity` (composer + liste),
  `ProjectsCatalog` (`/projects` filtres), `ImageUploader` (project-update)
- [x] **Tests unitaires** : tests colocalisés `src/**/*.test.ts` exécutés par Vitest.
- [ ] **Tests V1.5 dans `tests/` à réparer** — imports obsolètes et Playwright non installé ;
  `tests/**` est exclu de `tsconfig` et de Vitest depuis le 2026-10-26 (le build Next ne doit
  pas dépendre des specs E2E). **Intervention dev** : réinstaller `@playwright/test` ou
  supprimer les specs obsolètes, puis réactiver leur exécution.
- [x] **Documentation** : fiches UX `projects-catalog.md`, `project-detail-tabs.md`, `project-updates.md`
- [x] **Déploiement Render dev** : **build réparé (2026-10-26)** — commits `a556dae` →
  `9205eb8`, deploy `dep-dbfpvhvb9u1s739im4l0` **live**, `/api/health` = 200,
  `/api/graphql` = 200 (`{ __typename }`), `/sign-in` = 200. Correctifs : export
  `listProjectFollowersByProjectId`, collisions `deleteProject*`, composants UI manquants
  (`scroll-area`, `tabs`, `select`), Zod v4, enums projets, encodage des curseurs,
  fusion des inputs GraphQL dupliqués. Tests/lint non exécutés localement (disque plein,
  `node_modules` absent) : **non vérifiés**, seuls build et sondes déployées le sont.

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
- [x] **F15 — rejoindre un espace + console d'espace** : **vérifié (2026-10-21)** —
  accès `open`/`invite_code`/`invite_link`/`manual_approval`, approbation/refus/retrait
  des membres, configuration des méthodes, pages publiques `/spaces` + `/spaces/[slug]`,
  onglets console Membres/Accès. `npm test` (**242 verts / 4 skipped** = tests d'intégration
  DB en opt-in), `npm run lint` (0 erreur), `npm run typecheck` (0 erreur),
  `npm run build` (OK, `BUILD_ID` 17:16). Corrige au passage : apostrophes françaises
  échappées (`&apos;`) sur `/admin/otp` + spy `mockRestore` dans `auth-audit.test.ts`.
  Restent hors périmètre : modération d'espace (F20) et page dédiée `space_admin` hors
  `/admin` plateforme (voir `docs/backlog.md`).
- [ ] **Comptes (infos de connexion + suppression)** : l'API admin Better Auth exige une
  **clé serveur** (l'accès `/admin` par rôle ne suffit pas côté serveur).
  **Intervention utilisateur** : fournir la clé serveur.

## À faire par l'utilisateur (nécessite son intervention)
- ⚠️ **Sécurité — cookie de session exposé** : le cookie `__Secure-neon-auth.*` a été collé en
  clair dans `AGENTS.md` (WIP non commité). À retirer du fichier ; considérer la session comme
  compromise (se déconnecter/reconnecter). Ne jamais committer `AGENTS.md` avec ce contenu.
- **Render** : `srv-db46e4btqb8s73e8bsd0` déjà supprimé ; le dev utilise
  `srv-db4ek92jnfac73b4uij0`.
- **Turnstile** : **en attente** (retiré, ne doit pas bloquer l'app) ; à réactiver
  quand un domaine et des clés réelles existent.
- **Bucket stockage** : nommer le bucket Neon Object Storage (ADR 0004 « proposé »).
- **TURN** : choisir le fournisseur pour WebRTC (V1.5+).
- **Admin plateforme** : attribuer le rôle `admin` dans la console Neon Auth (déjà fait pour
  `alanniidrissou4@gmail.com`). Aucune variable à poser.
- **Comptes / suppression** : fournir une **clé serveur** Better Auth pour débloquer la lecture
  des identifiants et la suppression de compte (F17).
- **OTP admin (proposé)** : permettre à l'admin de voir les codes OTP envoyés aux
  utilisateurs — à cadrer (voir `docs/backlog.md`).
