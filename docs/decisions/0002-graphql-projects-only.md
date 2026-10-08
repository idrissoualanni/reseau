# ADR 0002 — GraphQL limité aux projets/posts

- **Statut** : accepté · **Date** : 2026-10-08

## Contexte
GraphQL est voulu pour gérer les posts ; le reste est simple (profil, compétences, recherche, upload).

## Décision
GraphQL (GraphQL Yoga + Pothos, route `POST /api/graphql`) **uniquement** pour les projets (et plus tard les publications du fil). REST pour tout le reste. Les pages serveur appellent directement les cas d'usage.

## Alternatives écartées
Tout en GraphQL — surcoût de schéma/résolveurs pour des opérations simples. Tout en REST — perd les lectures composées (projet + auteur + compétences) et l'évolution vers le fil.

## Conséquences
- Deux styles d'API à maintenir : règles dans `rules/api-graphql.md` et `rules/api-rest.md`.
- DataLoader, limite de profondeur/complexité et pagination par curseur obligatoires.
- Le plugin Drizzle de Pothos exige le Relational Query Builder v2 de Drizzle : figer les versions.
- Si GraphQL n'apporte pas de valeur mesurable après la V1, réévaluer par un nouvel ADR.
