# F03 — Créer son profil

- **Version** : V1 · **Dépend de** : F01, F02 · **Agents** : database, backend, frontend, designer, qa
- **Objectif** : après inscription, créer son profil public (membres connectés).
- **User story** : En tant que nouveau membre, je veux créer mon profil, afin d'être identifiable et de montrer ce que je sais faire.

## Règles métier
1. Un compte a **au plus un** profil (`profiles.user_id` unique).
2. Champs : `username` (obligatoire), `display_name` (obligatoire), `bio`, `school_name`, `field_of_study`, avatar (optionnel).
3. `username` : unique, minuscules, `[a-z0-9_]`, 3–30 car., non réservé (`admin`, `me`, `api`, `search`, `projects`, `u`, `sign-in`…). **Non modifiable ensuite en V1.**
4. L'avatar passe par l'upload présigné (F06 : `POST /api/uploads/presign`, type `avatar`).
5. Tant que le profil n'existe pas, toute page protégée redirige vers `/onboarding/profile`.
6. Le profil est visible par tous les membres connectés (pas d'accès anonyme en V1).

## Écrans / routes
`/onboarding/profile` (formulaire en une page, mobile d'abord). Fiche UX : `docs/ux/onboarding-profile.md`.

## API
REST `POST /api/me/profile` → `201` + profil. `GET /api/me/profile` → profil du membre connecté.
Disponibilité : `GET /api/profiles/username-available?u=…` → `{available:boolean}` (limité en débit).

## Données
Table `profiles` (voir `data-model.md`).

## Validation (Zod)
`username` regex `^[a-z0-9_]{3,30}$` · `display_name` 2–60 · `bio` ≤ 500 · `school_name` ≤ 100 · `field_of_study` ≤ 100 · `avatar_key` doit appartenir à l'utilisateur (préfixe `avatars/{profileId|userId}/`).

## Erreurs
| Cas | Code | Message |
|---|---|---|
| Username pris | CONFLICT | « Ce nom d'utilisateur est déjà utilisé. » |
| Username réservé | VALIDATION | « Ce nom n'est pas disponible. » |
| Profil déjà créé | CONFLICT | « Ton profil existe déjà. » |

## Sécurité
Le `user_id` vient de la session, **jamais** du corps de requête. Texte échappé à l'affichage (pas de HTML).

## Critères d'acceptation
- [x] Un nouveau membre remplit le formulaire et arrive sur son profil.
- [x] Un username déjà pris est refusé avec message clair.
- [x] Impossible de créer deux profils pour un compte.
- [x] Un membre sans profil ne peut accéder qu'à l'onboarding.
- [ ] Un avatar est optionnel et s'affiche une fois envoyé. *Reporté : dépend du stockage (F06), non tranché (voir `docs/TODO.md`).*

## Tests attendus
Unitaires : règles username, réservés, unicité (repository simulé). Intégration : contrainte unique. E2E : onboarding.

## Hors périmètre
Photo de couverture, liens externes, expériences/formations détaillées, import LinkedIn.
