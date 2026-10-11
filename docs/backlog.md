# Backlog — fonctionnalités à examiner après la V1

> Règle AGENTS.md : toute fonctionnalité non précisée dans les fichiers de
> feature (`docs/features/`) doit être listée ici pour être examinée après.
> Une idée utile se note ici au lieu d'être codée (règle « pas de fonctionnalité
> hors de la phase en cours »).

> F11 (posts texte + commentaires imbriqués) et F12 (image unique sur les posts)
> sont livrés en V1 (2026-10-10) — voir `docs/features/F11-posts.md` et
> `docs/features/F12-posts-images.md`. Le fil libre enrichi (vidéo) reste ici.

## QA intégration V1.5 (2026-10-11) — écarts constatés
- [ ] **Front posts hors GraphQL** — `/posts`, `/posts/[id]` et le fil de posts
  appellent les cas d'usage / actions serveur ; aucun client n'utilise
  `/api/graphql` (règle `api-graphql` §0 : les posts sont en GraphQL). Écart de
  périmètre à trancher (ADR) — non corrigé.
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

## Idées en attente (non triées)
- [ ] **Likes/réactions** sur les posts (V1.5+).
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
- [x] **Bucket tranché** : fait (2026-10-10) — images de posts sur `post` public_read
  ; avatars/couvertures suivront sur `profile` (TODO).
- [ ] **Turnstile** : widget anti-robot dès qu'un domaine existe (TODO).
- [ ] **Domaines de confiance Neon Auth** : origines staging + prod (TODO).
- [ ] **SMTP dédié** : SendGrid/Mailgun/AWS SES pour la production (TODO).
- [ ] **Supprimer le service `srv-db46e4btqb8s73e8bsd0`** (TODO).
- [ ] **Déploiement Render dev + Neon dev** depuis `dev` quand V1 terminée (TODO).
- [ ] **Changement d'e-mail/mot de passe** : interface planifiée V1.5.
- [ ] **Suppression de compte** : à planifier avant production.
- [ ] **Confidentialité par champ** : qui voit quoi (V1.5+).
- [ ] **CV/portfolio** : export, partage (V1.5+).