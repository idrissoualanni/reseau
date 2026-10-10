---
description: Worktrees git + jonction node_modules sur Windows. À lire avant de créer ou manipuler un worktree.
---
# Worktrees git + jonction node_modules

- 1 tâche = 1 branche = 1 worktree : `git worktree add <chemin> -b <tache>`.
- **Petits commits dans chaque worktree** : découper le lot en commits cohérents par couche (domaine, repos, API, UI, tests, docs) ; le projet doit compiler et fonctionner à chaque commit.
- **Jamais de travail direct sur `main`** depuis un worktree de tâche ; ne jamais fusionner dans `main` sans accord ; déployer depuis `dev` uniquement.
- Emplacement par défaut des worktrees : `.opencode/worktrees/` (les worktrees déjà créés sur le bureau restent valides — déclarer leur emplacement).

## Jonction node_modules (Windows)

- Créer la jonction avec **PowerShell** : `New-Item -ItemType Junction <worktree>\node_modules <repo>\node_modules`.
- **Jamais `mklink /J` depuis Git Bash** : MSYS mange `/J` ; la commande semble réussir mais rien n'est créé.
- **Jamais `npm install` dans un worktree jonctionné** : npm peut « reifier » et remplacer la jonction par un vrai dossier, saturant le disque. Installer dans le REPO PRINCIPAL uniquement (y compris `--no-save` temporaires, à reporter dans `package.json` avant merge).
- `.env.local` : copié dans chaque worktree selon `.worktreeinclude` (jamais committé).

## Vérifications dans un worktree

- Typecheck dans un arbre vierge : `next typegen` PUIS `tsc --noEmit` (les types `.next/types` manquent sinon — voir `nextjs.md`).
- Build : `next build` (Turbopack) échoue quand `node_modules` est une jonction (cible hors racine du worktree). En local : `next build --webpack`. En CI (Render) `node_modules` est réel → Turbopack OK.
- Lint/test/build : autorisés depuis le worktree via le `node_modules` partagé.
- Suppression après fusion : `git worktree remove <chemin>` puis `git branch -d <tache>`.