# F13 — Avatar de profil

- **Version** : V1 · **Dépend de** : F12 (mécanisme upload présigné), stockage Neon · **Agents** : backend, frontend
- **Objectif** : publier une photo de profil, affichée sur le profil et dans tout le réseau.
- **User story** : En tant que membre, je veux ajouter ma photo de profil, afin d'être reconnaissable dans le fil et la recherche.

## Règles métier

1. **1 avatar max par profil** : `profiles.avatar_key` nullable (colonne V1 existante, migration 0000 — aucune migration nouvelle).
2. **Upload présigné REST** (même mécanisme que F12, ADR 0004) : le navigateur PUT l'image vers une URL présignée Neon Object Storage ; le contenu ne transite jamais par l'API applicative.
3. **Types autorisés** : images uniquement (`image/jpeg`, `image/png`, `image/webp`, `image/gif`), taille max **5 Mo** (photo de profil).
4. **Appartenance** : la clé suit `profiles/{profileId}/{uuid}.{ext}` ; le cas d'usage `updateProfile` refuse une clé hors de ce préfixe (`ForbiddenError`).
5. **Le schéma expose `avatarUrl`, jamais `avatarKey`** (rules api-rest §10 / api-graphql §12). Le DTO REST passe de `avatarKey` → `avatarUrl`.
6. **Auteur du fil** : les DTO composeurs exposent `author.avatarUrl` (plus jamais de `ProfileSummaryRow` brut au client, qui contenait `avatarKey`).
7. **Retirer** : `avatarKey: null` efface la référence ; le fichier du bucket n'est pas supprimé en V1 (orphelins nettoyés plus tard, V1.5).
8. **Sans avatar** : repli sur les initiales (`Avatar`, comportement existant inchangé).

## Écrans / routes

- `/me/profile` : en-tête avec l'avatar (image si présente) ; section « Photo de profil » avec changer / retirer.
- `/u/[username]`, fil de posts, commentaires, recherche, cartes de projets : l'avatar de l'auteur est affiché (fallback initiales).
- Fiche UX : `docs/ux/profile-edit.md` (mise à jour).

## API

- **REST** : `POST /api/uploads/presign` — entrée `{ kind: "profile-avatar", contentType, size }` (joint au `kind: "post-image"` existant via un union discriminé), sortie `{ uploadUrl, key, expiresIn }` (URL présignée PUT, 15 min, bucket `profile`).
- **REST** : `PATCH /api/me/profile` — entrée `updateProfileSchema` étendu (`avatarKey` optionnel, nullable) ; sortie profil avec `avatarUrl`.
- **Action serveur** : `updateAvatarAction(avatarKey | null)` — session + appartenance, revalidation de la page.

## Données

- `profiles.avatar_key` text NULLABLE (déjà en base, migration 0000). Bucket `profile` en `public_read` (vérifié via MCP Neon).

## Validation (Zod)

- `avatarKeySchema` : `^profiles\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+$`, ≤ 300 caractères (miroir de `postImageKeySchema`).
- `presignAvatarSchema` : `kind: "profile-avatar"` + `contentType` image whitelist + `size` (1 octet à 5 Mo).

## Erreurs

| Cas | Code | Message |
|---|---|---|
| Clé hors préfixe du profil | 403 `FORBIDDEN` | « Cette image ne t'appartient pas. » |
| Type non image / taille > 5 Mo | 400 `VALIDATION` | message du schéma (Zod) |
| Session absente | 401 `UNAUTHENTICATED` | « Tu dois être connecté·e. » |

## Sécurité et autorisation

- L'identité vient de la session ; `avatarKey` transmis par la navigation est checké contre `profiles/{profile.id}/` dans le cas d'usage (jamais de préfixe tiré du client).
- Aucune clé de stockage exposée côté client (`avatarKey` interne, `avatarUrl` public) — rules api-rest §10, api-graphql §12, conventions §7.

## Critères d'acceptation

- [x] Étant donné un membre connecté avec profil, quand je choisis une image ≤ 5 Mo, alors l'avatar est uploadé et visible sur `/me/profile`.
- [x] Étant donné un avatar présent, quand je recharge `/u/[username]`, `/posts`, `/search`, alors l'avatar (ou les initiales) s'affiche.
- [x] Étant donné une clé `posts/...` envoyée comme avatar, quand je sauvegarde, alors 403 FORBIDDEN.
- [x] Étant donné un avatar présent, quand je clique « Retirer », alors le profil revient aux initiales (`avatar_key` null).

## Tests attendus

- Unitaires : `validation/profile.test.ts` (avatarKeySchema, presignAvatarSchema, updateProfileSchema avatarKey), `profile.test.ts` (appartenance), `mappers.test.ts` (`avatarUrl`), `search.test.ts` (`avatarUrl`).
- Intégration : route presign `kind` discriminé (post-image conservé, profile-avatar ajouté).

## Hors périmètre

- Couvertures de projets (bucket `projet`, lot suivant — TODO).
- Suppression physique des fichiers orphelins (V1.5).
- Avatars multiples / cadrage (V1.5+).