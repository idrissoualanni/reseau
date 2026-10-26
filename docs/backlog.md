# Backlog — fonctionnalités à examiner après la V1

> Règle AGENTS.md : toute fonctionnalité non précisée dans les fichiers de
> feature (`docs/features/`) doit être listée ici pour être examinée après.
> Une idée utile se note ici au lieu d'être codée (règle « pas de fonctionnalité
> hors de la phase en cours »).

> F11 (posts texte + commentaires imbriqués) et F12 (image unique sur les posts)
> sont livrés en V1 (2026-10-10) — voir `docs/features/F11-posts.md` et
> `docs/features/F12-posts-images.md`. Le fil libre enrichi (vidéo) reste ici.

## QA intégration V1.5 (2026-10-11) — écarts constatés
- [ ] **Visibilité des OTP par l'admin** — **tranché (2026-10-13)** : avec Neon Auth
  (Managed Better Auth), le code n'est **jamais** reçu par l'app ; l'afficher est
  impossible. Retenu : **option A** — journal des **envois** (`/admin/otp`), **jamais
  le code**. Écarté pour l'instant (à réexaminer) :
  - **option B** — SMTP custom + boîte de dev pour intercepter les e-mails : nécessite de
    sortir de l'envoi partagé Neon et de configurer un fournisseur (secret en plus).
  - **option C** — abandonner l'auth managée (self-hosted Better Auth) : perte du
    bénéfice Neon Auth, chantier majeur.
  Voir `docs/features/F17-administration-plateforme.md` §« Journal des envois OTP ».
- [ ] **Gestion des comptes par l'admin** — voir/list, bannir, supprimer : exige une clé
  serveur Better Auth (F17, `docs/TODO.md`).
- [x] **Front posts et GraphQL — tranché (2026-10-26)** : le schéma GraphQL expose
  `posts`, `post`, `createPost`, `updatePost`, `deletePost`, `addComment`,
  `deleteComment`, `togglePostLike` et les champs `likeCount`/`hasLiked`. Les pages
  Next rendues côté serveur appellent directement les cas d'usage (SSR, pas de
  round-trip HTTP interne) ; l'API publique reste GraphQL. Décision à consigner
  dans un ADR si le front bascule un jour en client séparé.
- [ ] **F11 : `addReply` absent du schéma** — les réponses passent par
  `addComment(input: { parentId })` (vérifié par test d'intégration). Aligner la
  fiche F11, ou créer la mutation `addReply` dédiée.
- [ ] **F11 : profondeur > 3 niveaux** — les réponses plus profondes sont
  masquées sans compteur ni « voir plus » (`buildCommentTrees`, `posts-feed.ts`),
  alors que la fiche le prévoit.

## Fil libre enrichi (V1.5 — texte/image/vidéo)
- [x] **Images sur les posts** : **livré V1 (2026-10-10)** — upload présigné Neon
  (bucket `post` public_read), fiche `docs/features/F12-posts-images.md`.
- [ ] **Vidéos dans le fil** : format décidé (MP4/H.264, 60 s, 50 Mo, Cloudflare
  Stream) — `docs/open-decisions.md` § fil libre. Hors V1.

## Projets V1.5 — Fonctionnalités sociales (F18/F19/F20) — **CODE LOCAL DONE (2026-10-25)**
- [x] **Migration BDD** : types `project_type_enum`, `project_reaction_type_enum`, tables `project_reactions`, `project_comments`, `project_followers`, `project_updates`, indexes partiels, trigramme — **appliquée sur Neon dev via MCP**
- [x] **F18 — Catalogue Projets** : `/projects` global, filtres (compétences, type, auteur, recherche trigramme), pagination curseur
- [x] **F19 — Social Projets** : Réactions (4 types), commentaires imbriqués (max 3 niveaux), suivre/ne plus suivre, notifications WebSocket
- [x] **F20 — Évolutions Projet (Updates)** : Auteur seul, texte + image (bucket `projet`), notifications followers temps réel
- [x] **Backend GraphQL** : query `projectsV15`, 8 mutations, DataLoaders complets
- [x] **Frontend** : `ProjectTabs`, `ProjectReactions`, `ProjectComments`, `ProjectFollowers`, `ProjectActivity`, `ProjectsCatalog`, `ImageUploader`
- [x] **Tests** : unitaires, intégration GraphQL, E2E Playwright
- [x] **Fiches UX** : `projects-catalog.md`, `project-detail-tabs.md`, `project-updates.md`
- [ ] **Déploiement Render dev** : secrets + WebSocket + sondes

## Messagerie (V2 — phase 4)
- [ ] **Messages privés chiffrés E2E** : le serveur ne voit jamais de contenu en
  clair ni de clé privée (règle non négociable).
- [ ] **Conversations** : liste, lecture, indicateurs de lecture.

## WebRTC (V1.5+ — phase 5)
- [ ] **Appels audio/vidéo** : signaling (`NEXT_PUBLIC_SIGNALING_URL`), STUN/TURN
  (`NEXT_PUBLIC_STUN_URL`, `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`).
- [ ] **Clés TURN** : choisir un fournisseur (Metered, Twilio, Cloudflare Calls).

## Réseau (phase 3)
- [ ] **Connexions** : demandes de contact, acceptation, liste.
- [ ] **Fil social** : posts des connexions (pas seulement les projets).

## Déduction de compétences + CV (phase 2)
- [ ] **CV généré** : depuis le profil et les activités publiées.
- [ ] **Niveau `demonstrated`** : dérivation depuis les projets publiés (déjà
  partiellement branché dans F05/F06 via `recomputeProofLevelsForProfile`).

## Autres types de profil (phase 6)
- [ ] **Entrepreneurs** : le cœur doit rester générique (règle non négociable).
- [ ] **Intégration universités** : établissement, filière, diplômes.

## Administration (V1.5)
- [x] **Console plateforme (F14/F16/F17 partie plateforme)** : **livré (2026-10-11)** —
  espaces, admins plateforme, journal d'accès, vues « tout voir ». Worktree `v1.5-admin`.
- [ ] **Console d'admin d'espace** : approuver/refuser/retirer des membres, configurer les
  méthodes d'accès, modération d'espace (reste de F17) — dépend de F15 et F20.
- [ ] **Comptes (identifiants + suppression)** : bloqué par le rôle `admin` de Neon Auth
  (intervention utilisateur).

## Espaces (V1.5 / V2)
- [ ] **Page dédiée `space_admin`** : écran des administrateurs d'espace **hors** console
  `/admin` plateforme (la console d'espace reste à livrer, voir ci-dessus) — à examiner.
- [ ] **`email_domain` (F29, V2)** : méthode d'accès par domaine e-mail (OTP vers une adresse
  du domaine autorisé) — enum `space_access_kind`, hors périmètre F15, à examiner en V2.

## Idées en attente (non triées)
- [x] **Likes/réactions sur les posts** : livré (2026-10-26) — `post_likes`,
  `togglePostLike`, `/me/posts`, compteurs dans le fil et le détail (F11).
- [ ] **Mentions** dans les commentaires.
- [ ] **Brouillon local** du post (composition `/posts/new`) — V1.5.
- [ ] **Recadrage / zoom d'image** à la composition — V1.5 (hors périmètre F12).
- [ ] **Filtres et tri du fil** (auteur, compétence, date) — V1.5.
- [ ] **Modération** des commentaires.
- [ ] **Recherche texte libre** sur nom/bio (F09 V1.5+).
- [ ] **Combinaison de plusieurs compétences** dans la recherche (F09 V1.5+).
- [ ] **Filtres établissement/filière** dans la recherche (F09 V1.5+).
- [ ] **Résultats par proximité géographique** (F09 V1.5+).
- [ ] **Recherche par recruteurs** (F09 V1.5+).
- [ ] **Avatar** : upload présigné (bucket `profile` public_read, même mécanisme que F12).
- [x] **Buckets tranchés et vérifiés (2026-10-26)** : `post` pour les images de posts,
  `profile` pour les avatars, `projet` pour les couvertures et updates. Buckets
  `asset`, `post`, `profile`, `projet`, `videos` présents dans Neon Object Storage ;
  premiers objets post/profil/projet vérifiés.
- [ ] **Turnstile — EN ATTENTE** : retiré des actions d'auth pour le dev (aucune clé
  requise) ; à réactiver dès qu'un domaine de confiance existe.
- [ ] **Domaines de confiance Neon Auth** : origines staging + prod (TODO).
- [ ] **SMTP dédié** : SendGrid/Mailgun/AWS SES pour la production (TODO).
- [x] **Service `srv-db46e4btqb8s73e8bsd0`** : supprimé (vérifié 404 le 2026-10-26).
- [x] **Déploiement Render dev + Neon dev** : service `reseau`
  (`srv-db4ek92jnfac73b4uij0`), branche `dev`, déployé et sondé (2026-10-26).
- [ ] **Changement d'e-mail** : interface planifiée V1.5.
- [x] **Changement de mot de passe** : parcours `mot de passe oublié` + code Neon Auth
  livré, champ mot de passe avec œil afficher/masquer.
- [ ] **Suppression de compte** : à planifier avant production.
- [ ] **Confidentialité par champ** : qui voit quoi (V1.5+).
- [ ] **CV/portfolio** : export, partage (V1.5+).