---
name: graphql-posts
description: Ajouter ou modifier une opération GraphQL pour les projets/posts (Yoga + Pothos, DataLoader, curseurs). À utiliser pour F05–F08 et les futurs posts du fil.
---
# GraphQL pour les projets

1. Contrat d'abord : schémas Zod dans `packages/shared`, puis type/champ/mutation Pothos dans `server/graphql/<type>.ts`.
2. Le résolveur appelle **un** cas d'usage (`modules/projects/application/…`). Aucun SQL, aucune règle métier dans le résolveur.
3. Contexte : `ctx.userId`, `ctx.profileId`, `ctx.loaders` ; jamais d'identité en argument.
4. Relations (auteur, compétences) via **DataLoader** ; ajouter un test qui compte les requêtes SQL.
5. Listes : connexion par curseur `(published_at, id)`, `first` ≤ 50.
6. Erreurs typées → `extensions.code` (`VALIDATION`, `FORBIDDEN`, `NOT_FOUND`, `UNAUTHENTICATED`, `CONFLICT`).
7. Régénérer et committer `apps/web/schema.graphql` ; la CI compare.
8. Tests : cas d'usage (unitaires), résolveur (exécution du schéma avec un contexte simulé), autorisation (un autre membre est refusé).
9. Côté client : requêtes typées ; pas de logique métier dans les composants.
