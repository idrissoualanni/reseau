# Fonctionnalités — liste complète et fiches

> Index unique des fonctionnalités du projet. Source des règles : `AGENTS.md`.
> Chaque fonctionnalité a (ou aura) une fiche `Fxx-slug.md` suivant `_template.md`.
> Processus : **fiche feature + fiche UX avant le code** (skill `feature-spec`), puis
> migration additive sur Neon **dev**, `lint`/`test`/`build` verts, merge sur `dev`.

Statuts : ✅ livré · 🔜 à développer · ⏳ reporté.

## Vue d'ensemble

| ID | Fonctionnalité | Version | Dépend de | Statut |
|---|---|---|---|---|
| F01 | Créer un compte | V1 | — | ✅ |
| F02 | Se connecter | V1 | F01 | ✅ |
| F03 | Créer son profil | V1 | F01 | ✅ |
| F04 | Ajouter des compétences | V1 | F03 | ✅ |
| F05 | Créer un projet | V1 | F03, F04 | ✅ |
| F06 | Publier un projet | V1 | F05 | ✅ |
| F07 | Parcourir les projets | V1 | F06 | ✅ |
| F08 | Voir un profil | V1 | F03 | ✅ |
| F09 | Rechercher des étudiants | V1 | F03, F04 | ✅ |
| F10 | Modifier son profil | V1 | F03 | ✅ |
| F11 | Posts et commentaires | V1 | F05, F07 | ✅ |
| F12 | Images sur les posts | V1 | F11 | ✅ |
| F13 | Avatar de profil | V1 | F12 | ✅ |
| F14 | Espaces (socle) | V1.5 | F03 | 🔜 |
| F15 | Rejoindre un espace (accès) | V1.5 | F14 | 🔜 |
| F16 | Rôles et appartenances | V1.5 | F14 | 🔜 |
| F17 | Administration d'espace | V1.5 | F15, F16 | 🔜 |
| F18 | Publications structurées | V1.5 | F05, F14 | 🔜 |
| F19 | Vidéo dans le fil | V1.5 | F12 | 🔜 |
| F20 | Modération et signalement | V1.5 | F11, F18 | 🔜 |
| F21 | Confidentialité par champ | V1.5 | F03, F18 | 🔜 |
| F22 | Suppression de compte | V1.5 | F01 | 🔜 |
| F23 | Recherche élargie | V1.5 | F09 | 🔜 |
| F24 | Réactions sur les posts | V1.5 | F11 | 🔜 |
| F25 | Mentions dans les commentaires | V1.5 | F11 | 🔜 |
| F26 | Filtres et tri du fil | V1.5 | F11 | 🔜 |
| F27 | Brouillon local et recadrage d'image | V1.5 | F12 | 🔜 |
| F28 | Changer e-mail / mot de passe | V1.5 | F01, F02 | 🔜 |
| F29 | Accès université par e-mail (`email_domain`) | V2 | F15 | ⏳ |
| F30 | Suggestions IA de compétences | V2 | F04, F18 | ⏳ |
| F31 | CV généré et modifiable | V2 | F05, F08 | ⏳ |
| F32 | Portfolio public | V2 | F31 | ⏳ |
| F33 | Connexions | V2 | F03 | ⏳ |
| F34 | Messagerie chiffrée de bout en bout | V2 | F33 | ⏳ |
| F35 | Appels audio / vidéo (WebRTC) | V2 | F33, F34 | ⏳ |
| F36 | Niveau de preuve `verifiable` | V3 | F05, F18, F32 | ⏳ |
| F37 | Espace recruteur | V3 | F08, F36 | ⏳ |
| F38 | Tableau de bord université | V3 | F14, F17 | ⏳ |
| F39 | Module entrepreneur | V3 | F14 | ⏳ |

## Ordre de développement (lots)

| Lot | Fonctionnalités | Version |
|---|---|---|
| L6 — Espaces socle | F14, F15, F16, F17 | V1.5 |
| L7 — Publications structurées | F18 | V1.5 |
| L8 — Fil vidéo | F19 | V1.5 |
| L9 — Confiance et contrôle | F20, F21, F22 | V1.5 |
| L10 — Confort du fil et recherche | F23, F24, F25, F26, F27, F28 | V1.5 |
| L11 — Accès université | F29 | V2 |
| L12 — IA et documents | F30, F31, F32 | V2 |
| L13 — Réseau | F33, F34, F35 | V2 |
| L14 — Preuve forte | F36 | V3 |
| L15 — Acteurs | F37, F38, F39 | V3 |

---

# V1.5 — fonctionnalités à développer

## F14 — Espaces (socle)

- **Version** : V1.5 · **Dépend de** : F03 · **Agents** : database, backend, frontend, designer
- **Objectif** : créer des espaces (université, filière, thème) avec membres, fil et règles.
- **Contenu** : un espace a un type, un nom/slug, une description, une visibilité
  (`public`/`private`) ; chaque espace propose une ou plusieurs méthodes d'accès (F15) ;
  page espace = fil de l'espace + liste des membres.
- **Données** : `spaces`, `space_access_methods`.
- **Hors périmètre** : statistiques d'insertion (V3), thématiques avancées, sous-espaces.

## F15 — Rejoindre un espace (méthodes d'accès)

- **Version** : V1.5 · **Dépend de** : F14 · **Agents** : backend, frontend, securite
- **Objectif** : rejoindre un espace par la méthode qu'il propose.
- **Contenu** : `open`, `invite_code`, `invite_link`, `manual_approval` (ADR 0006). La preuve
  est portée par **l'appartenance** (`membership.verification_level`, `verified_via`), jamais
  par le compte. Ajouter une méthode = 1 implémentation `AccessMethod` + 1 config.
  **Tout accès journalisé**.
- **Données** : `memberships`, `space_access_methods`, `space_access_log`.
- **Hors périmètre** : `email_domain` (F29, V2).

## F16 — Rôles et appartenances

- **Version** : V1.5 · **Dépend de** : F14 · **Agents** : backend, securite, frontend
- **Objectif** : porter des rôles sur chaque appartenance.
- **Contenu** : `member`, `space_admin`, `platform_admin` stockés en **données** (pas de
  `if role === …` dispersés). Autorisation **côté serveur**, moindre privilège. Un compte peut
  appartenir à plusieurs espaces avec des rôles différents.
- **Données** : `memberships.role`, `platform_admins`.
- **Hors périmètre** : rôles `recruiter`/`entrepreneur`/`mentor` (V3).

## F17 — Administration d'espace

- **Version** : V1.5 · **Dépend de** : F15, F16 · **Agents** : backend, frontend, designer
- **Objectif** : gérer membres, accès et contenu d'un espace.
- **Contenu** : admin d'espace = approuver/refuser/retirer des membres, configurer les
  méthodes d'accès, modérer, statistiques simples ; admin plateforme = créer/configurer un
  espace, nommer les admins, lire le **journal d'accès**.
- **Données** : `memberships`, `space_access_methods`, `space_access_log`.
- **Hors périmètre** : tableau de bord d'insertion (V3).

## F18 — Publications structurées

- **Version** : V1.5 · **Dépend de** : F05, F14 · **Agents** : database, backend, frontend, designer
- **Objectif** : publier un fait typé qui peut nourrir le profil.
- **Contenu** : 4 types — `learned` (appris), `built` (construit), `participated` (participé),
  `achieved` (obtenu). Champs communs : `type`, `title` (3–120), `body`, `skills[]`,
  `media[]`, `visibility` (`private`/`space`/`public`), `occurred_at`. On choisit le **type
  d'abord**. L'auteur **choisit** ce qui remonte au profil. Aucun jugement par les pairs
  (ADR 0007).
- **Données** : `structured_posts`, `structured_post_skills`, références média.
- **Hors périmètre** : `verifiable` (F36, V3).

## F19 — Vidéo dans le fil

- **Version** : V1.5 · **Dépend de** : F12 · **Agents** : backend, frontend, devops, securite
- **Objectif** : publier et lire une vidéo courte dans le fil.
- **Contenu** : upload présigné (client → Neon direct), bucket **`videos`** déjà créé
  (`public_read`) ; clés `videos/{profileId}/{uuid}.{ext}` + poster. MP4/H.264 + AAC,
  **≤ 60 s**, **≤ 50 Mo**, `content-type` vidéo. Lecture `<video preload="metadata">`, **pas
  d'autoplay sonore**, Range requests (seeking). **Pas de transcodage** au départ.
- **Données** : `media_assets` (type, statut, durée, poids, poster).
- **Hors périmètre** : transcodage multi-qualités, live, montage (Cloudflare Stream → plus tard).

## F20 — Modération et signalement

- **Version** : V1.5 · **Dépend de** : F11, F18 · **Agents** : backend, frontend, securite
- **Objectif** : signaler et traiter un contenu inapproprié.
- **Contenu** : signaler un post/commentaire/vidéo (motif) ; file de traitement pour
  `space_admin`/`platform_admin` ; masquage/retrait ; journal.
- **Données** : `reports` (cible, motif, statut, traité par).
- **Hors périmètre** : modération automatique par IA.

## F21 — Confidentialité par champ

- **Version** : V1.5 · **Dépend de** : F03, F18 · **Agents** : backend, securite, frontend
- **Objectif** : choisir qui voit quoi.
- **Contenu** : profils et publications portent une visibilité (`private`/`space`/`public`) ;
  autorisation **serveur** systématique ; rien de privé n'est exposé dans les DTO.
- **Données** : colonnes de visibilité sur `profiles`, `structured_posts`.
- **Hors périmètre** : permissions fines par champ complexe, listes d'amis.

## F22 — Suppression de compte

- **Version** : V1.5 · **Dépend de** : F01 · **Agents** : backend, securite, devops
- **Objectif** : supprimer son compte et ses données (obligation probable).
- **Contenu** : confirmation claire, suppression/anonymisation des données personnelles,
  conservation du strict nécessaire légal, effet sur les contenus publiés (signalés comme
  « compte supprimé »).
- **Données** : `profiles`, contenus associés.
- **Hors périmètre** : export de données (à décider), RGPD complet.

## F23 — Recherche élargie

- **Version** : V1.5 · **Dépend de** : F09 · **Agents** : backend, frontend
- **Objectif** : trouver des profils plus finement.
- **Contenu** : recherche texte libre (nom/bio), combinaison de plusieurs compétences,
  filtres établissement/filière (liés aux espaces).
- **Données** : index sur `profiles`, `user_skills`, `memberships`.
- **Hors périmètre** : recherche full-text multilingue, recherche par recruteur (V3).

## F24 — Réactions sur les posts

- **Version** : V1.5 · **Dépend de** : F11 · **Agents** : backend, frontend
- **Objectif** : réagir à un post (au moins « j'aime »).
- **Contenu** : une réaction par membre et par post ; compteur affiché ; retrait.
- **Données** : `post_reactions`.
- **Hors périmètre** : réactions multiples/emoji variés.

## F25 — Mentions dans les commentaires

- **Version** : V1.5 · **Dépend de** : F11 · **Agents** : backend, frontend
- **Objectif** : mentionner `@utilisateur` dans un commentaire.
- **Contenu** : autocomplétion des membres, lien vers le profil, notification à décider.
- **Données** : analyse du corps du commentaire (pas de table obligatoire).
- **Hors périmètre** : notifications temps réel (à décider).

## F26 — Filtres et tri du fil

- **Version** : V1.5 · **Dépend de** : F11 · **Agents** : backend, frontend
- **Objectif** : retrouver un contenu dans le fil.
- **Contenu** : filtres par auteur et par compétence, tri par date ; état dans l'URL.
- **Données** : index existants.
- **Hors périmètre** : fil infini, recommandation algorithmique.

## F27 — Brouillon local et recadrage d'image

- **Version** : V1.5 · **Dépend de** : F12 · **Agents** : frontend, designer
- **Objectif** : composer sereinement.
- **Contenu** : brouillon conservé localement (localStorage) ; recadrage/zoom de l'image
  avant publication.
- **Données** : aucune (local).
- **Hors périmètre** : brouillon synchronisé serveur, multi-images.

## F28 — Changer e-mail / mot de passe

- **Version** : V1.5 · **Dépend de** : F01, F02 · **Agents** : backend, frontend, securite
- **Objectif** : gérer ses identifiants.
- **Contenu** : changement d'e-mail (re-vérification OTP) et de mot de passe (ancien mot de
  passe requis) via Neon Auth.
- **Données** : Neon Auth (aucune table applicative).
- **Hors périmètre** : 2FA/MFA, passkeys (à décider).

---

# V2 — fonctionnalités reportées

- **F29 — Accès université par e-mail (`email_domain`)** : OTP vers une adresse du domaine
  autorisé ; preuve portée par l'appartenance. Sécurité : suffixe exact après `@`, refus des
  domaines publics, OTP à usage unique, rate-limit.
- **F30 — Suggestions IA de compétences** : l'IA propose depuis les publications,
  l'utilisateur accepte/refuse. `skill_suggestions`.
- **F31 — CV généré et modifiable** : document JSON par sections, éditable, section `edited`
  jamais écrasée, export PDF.
- **F32 — Portfolio public** : version visuelle du CV, mêmes règles d'édition, lien de partage.
- **F33 — Connexions** : demandes de contact, acceptation, liste.
- **F34 — Messagerie chiffrée E2E** : service `apps/realtime`, clé privée jamais côté serveur.
- **F35 — Appels audio/vidéo WebRTC** : signaling + TURN géré.

# V3 — fonctionnalités reportées

- **F36 — Niveau de preuve `verifiable`** : lien d'artefact contrôlable (dépôt, certificat,
  projet en ligne), vérification technique, pas d'avis humain.
- **F37 — Espace recruteur** : recherche sur preuves, tableau de bord.
- **F38 — Tableau de bord université** : suivi d'insertion de l'établissement.
- **F39 — Module entrepreneur** : ressources, mentorat, mises en relation.
