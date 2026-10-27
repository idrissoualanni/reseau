# F12 — Images sur les posts

- **Version** : V1 → V1.5 (galerie 5 images) · **Dépend de** : F11, stockage Neon · **Agents** : database, backend, frontend, qa
- **Objectif** : publier un post avec une à cinq images, affichées dans le fil et le détail.
- **User story** : En tant que membre, je veux illustrer mon post de plusieurs images, afin de mieux partager mon activité.

## Règles métier
1. **Galerie de 5 images maximum** (V1.5) : la première image est la couverture (`posts.image_key`), les 4 suivantes vivent dans `posts.image_keys` (tableau ordonné, `cardinality ≤ 4`). Un post sans image reste valide.
2. **Upload présigné REST** (ADR 0004) : le navigateur PUT l'image vers une URL présignée Neon Object Storage ; le contenu ne transite jamais par l'API applicative.
3. **Types autorisés** : images uniquement (`image/jpeg`, `image/png`, `image/webp`, `image/gif`), taille max 10 Mo.
4. **Appartenance** : la clé suit `posts/{profileId}/{uuid}.{ext}` ; le cas d'usage refuse une clé hors de ce préfixe.
5. **Le schéma GraphQL expose `imageUrl` et `imageUrls` (liste ordonnée), jamais les clés** (rule api-graphql §19).
6. **Post sans image** : `imageUrl` nul, aucun impact sur le fil existant.
7. **Suppression** : supprimer un post ne supprime pas le fichier du bucket en V1 (fichiers orphelins nettoyés plus tard, V1.5).
8. **Aperçu fidèle** : à la composition, l'image est prévisualisée avec le cadrage du fil (`object-cover`, même ratio) pour montrer le rendu final. **Le recadrage (zoom/déplacement) reste hors V1** (V1.5).

## Écrans / routes
- `/posts` (fil) : carte de post avec galerie (flèches + compteur `n/5`).
- `/posts/new` (composition dédiée) : sélecteur multi-images (5 max) + aperçu, la première image = couverture.
- `/posts/[id]` (détail) : galerie au-dessus des commentaires.
- `/posts/[id]/edit` : galerie actuelle, ajout/retrait/réordonnancement par retrait.
- `/me/posts` : vignette de couverture.
- Fiche UX : `docs/ux/posts.md` (mise à jour).

## API
- **REST** : `POST /api/uploads/presign` — entrée `{ kind: "post-image", contentType, size, profileId? }` (session), sortie `{ uploadUrl, key, expiresIn }` (l'URL est présignée PUT, durée 15 min). Une requête par image.
- **GraphQL** : `createPost(input: { body, imageKey?, imageKeys? })` ; `Post.imageUrl` (couverture) et `Post.imageUrls` (galerie ordonnée), résolus côté serveur via `getPublicUrl`, jamais les clés.

## Données
- `posts.image_key` text NULLABLE (migration 0005 additive) — couverture.
- `posts.image_keys` text[] NOT NULL DEFAULT '{}' (migration 0012 additive) — images 2 à 5, contrainte `cardinality BETWEEN 0 AND 4`.

## Validation (Zod)
- `postImageKeySchema` : `/^posts\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/i`, max 300.
- `galleryImageKeysSchema` : 4 clés maximum, pas de doublon ; appartenance (préfixe `posts/{profileId}/`) vérifiée par le cas d'usage.
- `createPostSchema` / `updatePostSchema` : `imageKey` et `imageKeys` optionnels.

## Erreurs
- Type non image → 400 `VALIDATION` « Format d'image non supporté. »
- Taille > 10 Mo → 400 `VALIDATION` « Image trop lourde (10 Mo maximum). »
- Clé hors préfixe → 422 `RULE_VIOLATION` « Clé d'image invalide. »
- Session expirée → 401 `UNAUTHENTICATED`.

## Sécurité et autorisation
- Seul le membre connecté upload ; la clé porte son `profileId` (appartenance vérifiée côté serveur).
- Aucune clé AWS exposée au client ; le client reçoit seulement l'URL présignée.
- Origin + rate limit sur la route d'upload (`guardMutation`).

## Critères d'acceptation
- [ ] Given un membre connecté, When il publie un post avec une image, Then l'image s'affiche dans le fil et le détail.
- [ ] Given un post existant sans image, When on le lit, Then `imageUrl` est nul.
- [ ] Given une image > 10 Mo ou non-image, When on demande un upload, Then l'API refuse (400).
- [ ] Given une clé hors préfixe `posts/{profileId}/`, When on publie, Then le cas d'usage refuse (422).
- [ ] Given un post avec image, When on lit son `imageUrl` via GraphQL, Then la clé n'est jamais exposée.
- [ ] Given une image choisie à la composition, When on l'ajoute, Then l'aperçu reprend le cadrage du fil (rendu final).

## Tests attendus
- Unitaires : schéma imageKey, validation, cas d'usage (accepte/refuse selon préfixe).
- Validation Zod : formats et appartenance.
- E2E : composer → upload → publier → image visible.

## Hors périmètre
Multi-images, recadrage, galerie, vidéos (V1.5+), nettoyage des fichiers orphelins (V1.5).