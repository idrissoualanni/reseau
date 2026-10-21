---
description: Neon, Drizzle, migrations, index
paths: ["src/db/**", "drizzle/**", "drizzle.config.ts"]
---
# Base de données

- Schéma dans `src/db/schema.ts` ; migrations dans `drizzle/` (générées par `npm run db:generate`, relues, committées).
- **Migrations sur Neon = MCP obligatoire** : `drizzle-kit migrate` ne persiste pas sur
  Neon (driver `@neondatabase/serverless`). Appliquer le SQL via **MCP Neon**
  (`run_sql_transaction`, SQL additif `IF NOT EXISTS`) **puis** enregistrer la ligne dans
  `drizzle.__drizzle_migrations` : `hash` = SHA-256 du fichier SQL, `created_at` = epoch ms.
  Vérifier ensuite : `count(*)` des migrations + `information_schema` / `pg_indexes`.
  Écart vérifié = migration « appliquée » qui ne l'est pas (vécu 2026-10-21 : 0008 absente).
- **Jamais** de modification manuelle de la base ni d'édition d'une migration déjà fusionnée dans `dev`. Corriger = nouvelle migration.
- Migrations : *expand puis contract* (ajouter nullable → déployer → remplir → contraindre/supprimer plus tard). Une migration = un changement logique.
- Extensions/index GIN/trigramme : migration SQL personnalisée (`drizzle-kit generate --custom`).
- Migrations appliquées sur **dev** d'abord avec `DATABASE_URL_UNPOOLED` ; production seulement après validation de dev.
- Tables : `uuid` PK, `created_at`/`updated_at timestamptz`, clés étrangères avec `ON DELETE` explicite, contraintes `CHECK` pour les bornes (longueurs, énums).
- Une table future n'est **pas** créée avant sa version (`docs/data-model.md`).
- Requêtes : sélectionner les colonnes nécessaires, pagination **par curseur**, jamais `OFFSET` sur les listes publiques, jointures plutôt que boucles (pas de N+1).
- Pagination par tuple curseur : comparer avec des génériques `TSort extends AnyColumn` / `TId extends AnyColumn` (pour `lt`/`eq`), jamais un type union du genre `SQL | PgColumn` dans la naissance du tuple.
- Toute requête de recherche/liste livre son `EXPLAIN` dans la PR si elle manipule > 1 000 lignes en test.
- Transactions pour toute opération multi-tables (publier + recalcul de preuve).
- Neon : connexion poolée au runtime, directe pour les migrations ; branches Neon `dev` et `main` séparées.
