---
description: Branches, worktrees, PR, déploiement dev → main
---
# Git et livraison

- `main` = production · `dev` = intégration et validation · `feat/Fxx-slug` = une tâche, un worktree.
- Jamais de commit ni de push direct sur `main`/`dev` ; jamais `push --force`, `reset --hard` partagé, ni `--no-verify`. (Le hook `guard-git` bloque ces cas.)
- Créer le worktree : `git worktree add ../reseau-worktrees/feat-F05-create-project -b feat/F05-create-project dev`. Supprimer après merge : `git worktree remove …`.
- Petits commits conventionnels, rebase sur `dev` avant la PR.
- PR vers `dev` : CI verte (lint, typecheck, tests, schéma GraphQL à jour, build) + DoD cochée.
- Merge `dev` → déploiement Render **dev** automatique → validation manuelle → `/release` : PR `dev` → `main` + tag SemVer + CHANGELOG.
- Migration dans la PR : relue par `database` ; appliquée sur dev au déploiement ; production seulement après validation.
- Hotfix : branche depuis `main`, PR vers `main`, puis fusion de `main` dans `dev`.
- Un agent ne fusionne jamais sa propre PR vers `main`.
- **Fichiers locaux à ignorer** : `AGENTS.local.md`, `.env.local` et instructions
  personnalisées ne doivent jamais être trackés. Vérifier l'orthographe exacte du
  pattern dans `.gitignore` (ex. `AGENTS.local.md` avec un `S`, pas `AGENT.local.md`)
  et confirmer avec `git check-ignore -v <fichier>` avant de committer.
