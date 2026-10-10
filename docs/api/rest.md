# API REST — catalogue V1

> Périmètre : tout sauf les projets et les posts (GraphQL, ADR 0002). L'implémentation
> vit dans `src/app/api/**` (structure **racine unique** ; voir `.claude/rules/architecture.md`).
> Conventions : `.claude/rules/api-rest.md`. Identité : toujours la session serveur, jamais
> un identifiant reçu du client.

## Format

- Succès : objet JSON. Liste : `{ "items": [...] }` (enveloppe stable, même sans curseur).
- Erreur : `{ "error": { "code", "message", "fields?" } }` — `fields` seulement pour
  `VALIDATION` / `RULE_VIOLATION`. Aucun détail technique exposé.
- Codes : `VALIDATION` 400 · `UNAUTHENTICATED` 401 · `FORBIDDEN` 403 ·
  `NOT_FOUND` 404 · `CONFLICT` 409 · `RULE_VIOLATION` 422 · `RATE_LIMITED` 429 ·
  `INTERNAL` 500.

## Authentification

Toutes les routes `/api/**` sont **hors du proxy** : un handler non public répond
`401` en JSON (jamais une redirection HTML). Seul `/api/health` est public.
Les handlers appellent `requireSession()` (`src/lib/auth.ts`) ; `user_id` provient du
jeton de session.

## Routes V1

| Méthode | Route | Cas d'usage | Entrée | Sortie | Succès |
|---|---|---|---|---|---|
| GET | `/api/health` | sonde Render | — | `{status,database,…}` | 200 / 503 |
| GET | `/api/me/profile` | `getOwnProfile` | session | profil (sans `user_id`) | 200 |
| POST | `/api/me/profile` | `createProfile` | `createProfileSchema` | profil | 201 |
| PATCH | `/api/me/profile` | `updateProfile` | `updateProfileSchema` | profil | 200 |
| GET | `/api/me/skills` | `listOwnSkills` | session | `{items}` badges + niveau | 200 |
| POST | `/api/me/skills` | `addOwnSkill` | `{name}` | badge | 201 |
| DELETE | `/api/me/skills/{skillId}` | `removeOwnSkill` | `skillId` | — | 204 |
| GET | `/api/skills` | `searchSkillCatalog` | `?q=&limit=` | `{items}` | 200 |
| GET | `/api/profiles/username-available` | `isUsernameAvailable` | `?u=` | `{available}` | 200 |
| ALL | `/api/auth/[...path]` | handler Neon Auth | — | — | — |
| POST | `/api/uploads/presign` | `presignPostImageUpload` / `presignAvatarUpload` | `presignPostImageSchema` \| `presignAvatarSchema` | `{uploadUrl,key,expiresIn}` | 200 |

`POST /api/uploads/presign` (F12 posts, F13 avatar) : union discriminée sur `kind`.

- `{kind:"post-image", contentType, size}` — image jpeg/png/webp/gif, ≤ 10 Mo.
  Réponse : URL S3 présignée (PUT 15 min) + `key` `posts/{profileId}/{uuid}.{ext}`.
  Le client PUT le binaire directement sur `uploadUrl` — le contenu ne transite
  jamais par l'API applicative ; `key` est ensuite transmis à `createPost`
  (imageKey) et exposé en lecture uniquement sous forme d'`imageUrl`.
- `{kind:"profile-avatar", contentType, size}` — image jpeg/png/webp/gif, ≤ 5 Mo.
  Réponse : `key` `profiles/{profileId}/{uuid}.{ext}` (bucket `profile`). La clé est
  ensuite transmise à `updateAvatarAction` (F13) ; le profil n'expose que `avatarUrl`.

`avatarKey` reste **interne au serveur** : seules les vues publiques (`avatarUrl`,
`imageUrl`) sortent (règles api-rest §10, api-graphql §12).

## Reste à faire (lots ultérieurs)

- `GET /api/profiles/{username}` et `GET /api/search/students` — F08/F09 (Lot 4).
- **Anti-CSRF / limitation de débit** sur les mutations REST : le navigateur même-origine
  et les cookies `SameSite` couvrent une partie du risque ; vérifier l'en-tête `Origin`
  et poser un plafond sur `username-available` et `POST /api/me/skills` avant la
  production.
- `Cache-Control: private, max-age=300` posé sur `/api/skills` (référentiel peu changeant).
