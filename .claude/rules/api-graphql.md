---
description: GraphQL (Yoga + Pothos) pour les projets
paths: ["apps/web/src/server/graphql/**", "apps/web/src/app/api/graphql/**"]
---
# GraphQL (projets/posts uniquement)

- Serveur : GraphQL Yoga dans `app/api/graphql/route.ts` ; schéma code-first avec Pothos (`server/graphql/builder.ts`, un fichier par type). Schéma exporté en SDL dans `apps/web/schema.graphql` et **committé** ; la CI échoue s'il diffère.
- Les résolveurs sont **minces** : ils appellent un cas d'usage de `application/`. Pas de SQL, pas de règle métier.
- Contexte : `{ userId, profileId, loaders }` construit depuis la session. L'identité n'est **jamais** un argument.
- **DataLoader** pour auteurs, compétences, compteurs. Un test vérifie que le nombre de requêtes SQL ne dépend pas du nombre d'éléments.
- Pagination type « connection » par curseur opaque ; `first` ≤ 50.
- Limites : profondeur ≤ 6, complexité bornée, introspection **désactivée en production**, messages d'erreur masqués (codes dans `extensions.code` : `VALIDATION`, `FORBIDDEN`, `NOT_FOUND`, `UNAUTHENTICATED`, `CONFLICT`).
- Entrées validées par les schémas Zod partagés (plugin Zod de Pothos ou validation dans le cas d'usage).
- Nommage : requêtes `projects`, `project`, `myProjects` ; mutations verbe + objet (`publishProject`). Entrées `XxxInput`, jamais d'arguments en vrac.
- Pas d'upload de fichier via GraphQL : on passe une `coverKey` obtenue par l'URL présignée (REST).
- N'ajouter aucun nouveau domaine en GraphQL sans ADR (`0002`).
