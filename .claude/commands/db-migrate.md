---
description: Créer, relire et appliquer une migration Drizzle (dev d'abord)
argument-hint: <description du changement de schéma>
---
Changement de schéma : **$ARGUMENTS**

Utilise le skill `drizzle-migration`.
1. Vérifie que la table/colonne est autorisée dans la version en cours (`docs/data-model.md`).
2. Modifie le schéma `packages/db/src/schema/`. Génère : `npm run db:generate`. Pour index GIN/extensions : `--custom`.
3. Relis le SQL généré : style *expand puis contract*, pas de perte de données, index nécessaires, `ON DELETE` explicite.
4. Applique **sur dev uniquement** : `npm run db:migrate` avec la connexion de la branche Neon `dev`. **Jamais en production** sans validation humaine.
5. Mets à jour `docs/data-model.md`. Montre-moi le SQL et le plan de retour arrière.
