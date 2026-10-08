---
description: Produire un plan d'implémentation validable (mode plan, lecture seule)
---
Plan pour : **$ARGUMENTS**

**Reste en mode plan : ne modifie aucun fichier de code.** Tu n'écris que `docs/plans/AAAA-MM-JJ-<slug>.md`.

1. Lis `CLAUDE.md`, la fiche, la fiche UX (`docs/ux/…`), `docs/architecture.md`, `docs/data-model.md`, les règles de `.claude/rules/`.
2. Si la fiche UX d'une page manque, la première tâche du plan est « fiche UX (designer) ».
3. Le plan contient, dans cet ordre :
   - **Objectif** et lien vers la fiche
   - **Contrat** : schémas Zod (`packages/shared`), opérations GraphQL/REST
   - **Tâches par couche** avec agent propriétaire : database → backend (data, application, api) → frontend → qa
   - **Fichiers créés/modifiés** (chemins exacts)
   - **Migration** (expand/contract) et plan de retour arrière
   - **Tests** : liste des cas, un par règle/critère
   - **Parallélisation** : ce qui peut avancer en même temps après le contrat
   - **Risques** et **questions ouvertes**
   - **Statut : brouillon**
4. Termine en demandant la validation : « Réponds *Plan approuvé* pour lancer `/build`. » N'avance pas sans cette réponse.