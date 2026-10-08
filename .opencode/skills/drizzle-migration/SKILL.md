---
name: drizzle-migration
description: Créer et appliquer une migration Drizzle sur Neon (schéma, SQL personnalisé pour index/extensions, expand puis contract). À utiliser pour tout changement de base de données.
---
# Migration Drizzle + Neon

**Outils** : `drizzle-kit` ; schéma dans `packages/db/src/schema/` ; migrations dans `packages/db/migrations/`.

1. Modifier le schéma TypeScript (enum, table, relation, index).
2. `pnpm db:generate` → relire le SQL. Pour extensions/index GIN/trigramme/index partiels : `pnpm db:generate -- --custom` puis écrire le SQL à la main (voir `docs/data-model.md`).
3. Contrôles : colonnes nouvelles **nullables ou avec défaut** (expand) ; `ON DELETE` explicite ; contraintes `CHECK` ; nom d'index explicite ; pas de `DROP` de donnée dans la même migration qu'un ajout.
4. Appliquer sur la branche Neon **dev** avec `DATABASE_URL_UNPOOLED`. Vérifier avec `pnpm db:studio` ou une requête.
5. Ne jamais modifier une migration déjà fusionnée dans `dev` ; corriger par une nouvelle migration.
6. Production : après validation de dev uniquement, via le flux `/release`.
7. Mettre à jour `docs/data-model.md`. Consigner le plan de retour arrière dans la PR.
**Rappel** : une table n'est créée que dans la version qui l'utilise.
