---
description: Neon, Drizzle, migrations, index
paths: ["packages/db/**", "apps/web/src/modules/*/data/**"]
---
# Base de données

- Schéma dans `packages/db/src/schema/*.ts` ; migrations dans `packages/db/migrations/` (générées par `npm run db:generate`, relues, committées).
- **Jamais** de modification manuelle de la base ni d'édition d'une migration déjà fusionnée dans `dev`. Corriger = nouvelle migration.
- Migrations : *expand puis contract* (ajouter nullable → déployer → remplir → contraindre/supprimer plus tard). Une migration = un changement logique.
- Extensions/index GIN/trigramme : migration SQL personnalisée (`drizzle-kit generate --custom`).
- Migrations appliquées sur **dev** d'abord avec `DATABASE_URL_UNPOOLED` ; production seulement après validation de dev.
- Tables : `uuid` PK, `created_at`/`updated_at timestamptz`, clés étrangères avec `ON DELETE` explicite, contraintes `CHECK` pour les bornes (longueurs, énums).
- Une table future n'est **pas** créée avant sa version (`docs/data-model.md`).
- Requêtes : sélectionner les colonnes nécessaires, pagination **par curseur**, jamais `OFFSET` sur les listes publiques, jointures plutôt que boucles (pas de N+1).
- Toute requête de recherche/liste livre son `EXPLAIN` dans la PR si elle manipule > 1 000 lignes en test.
- Transactions pour toute opération multi-tables (publier + recalcul de preuve).
- Neon : connexion poolée au runtime, directe pour les migrations ; branches Neon `dev` et `main` séparées.
