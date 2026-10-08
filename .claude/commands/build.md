---
description: Construire à partir d'un plan approuvé (worktree, couches, tests, auto-revue)
argument-hint: <chemin du plan ou Fxx>
---
Construction du plan : **$ARGUMENTS**

**Garde-fou** : ouvre le plan ; si son statut n'est pas « approuvé », arrête-toi et demande `/plan` + validation.

1. Crée le worktree et la branche (`rules/git-workflow.md`) depuis `dev`.
2. Exécute **dans l'ordre** : contrat partagé → schéma + migration → `data` → `application` → API (REST/GraphQL) → UI → tests. Délègue aux agents propriétaires (`.claude/agents/`) ; parallélise backend/frontend seulement après le contrat.
3. Après chaque couche : `npm run typecheck && npm run lint && npm test`. Commit conventionnel court.
4. Reste dans le plan. Idée hors plan ou hors version ? Note-la dans « Questions ouvertes » du plan, ne la code pas.
5. Auto-revue avec la Définition de « terminé » (`docs/workflow.md`) ; coche chaque ligne dans la description de la PR.
6. Demande la revue croisée : `security` puis `qa` puis `docs`. Corrige.
7. Ouvre la PR vers `dev`. Mets le statut du plan à « terminé » après merge.
8. Résume : ce qui est fait, tests ajoutés, points à valider manuellement sur dev.
