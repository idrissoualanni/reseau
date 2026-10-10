# F12 — Images sur les posts

- **Version** : V1 · **Dépend de** : F11, stockage Neon · **Agents** : database, backend, frontend, qa
- **Objectif** : publier un post avec une image, affichée dans le fil et le détail.
- **User story** : En tant que membre, je veux illustrer mon post d'une image, afin de mieux partager mon activité.

## Règles métier
1. **1 image max par post en V1** : le post a zéro ou une image (`posts.image_key` nullable).
2. **Upload présigné REST** (ADR 0004) : le navigateur PUT l'image vers une URL présignée Neon Object Storage ; le contenu ne transite jamais par l'API applicative.
3. **Types autorisés** : images uniquement (`image/jpeg`, `image/png`, `image/webp`, `image/gif`), taille max 10 Mo.
4. **Appartenance** : la clé suit `posts/{profileId}/{uuid}.{ext}` ; le cas d'usage refuse une clé hors de ce préfixe.
5. **Le schéma GraphQL expose `imageUrl`, jamais `imageKey`** (rule api-graphql §19).
6. **Post sans image** : `imageUrl` nul, aucun impact sur le fil existant.
7. **Suppression** : supprimer un post ne supprime pas le fichier du bucket en V1 (fichiers orphelins nettoyés plus tard, V1.5).

## Écrans / routes
- `/posts` (fil) : carte de post avec image (si présente) ; composer avec sélecteur d'image.
- `/posts/[id]` (détail) : image du post affichée au-dessus du texte.
- Fiche UX : `docs/ux/posts.md` (mise à jour).

## API
- **REST** : `POST /api/uploads/presign` — entrée `{ kind: "post-image", contentType, size, profileId? }` (session), sortie `{ uploadUrl, key, expiresIn }` (l'URL est présignée PUT, durée 15 min).
- **GraphQL** : `createPost(input: { body, imageKey? })` ; `Post.imageUrl` (résolu côté serveur via `getPublicUrl`, jamais la clé).

## Données
- `posts.image_key` text NULLABLE (migration 0005 additive).

## Validation (Zod)
- `postImageKeySchema` : `/^posts\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/i`, max 300.
- `createPostSchema` : `imageKey` optionnel + appartenance vérifiée par le cas d'usage.

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

## Tests attendus
- Unitaires : schéma imageKey, validation, cas d'usage (accepte/refuse selon préfixe).
- Validation Zod : formats et appartenance.
- E2E : composer → upload → publier → image visible.

## Hors périmètre
Multi-images, recadrage, galerie, vidéos (V1.5+), nettoyage des fichiers orphelins (V1.5), suppressions d'images à chaud.