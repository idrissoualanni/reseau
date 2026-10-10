# Worktrees git + jonction node_modules

Miroir concis de `.claude/rules/worktrees.md` (source autoritaire).

- 1 tâche = 1 branche = 1 worktree. Jamais de travail direct sur `main` ; déployer depuis `dev`.
- **Petits commits dans chaque worktree** : un commit cohérent par couche (domaine, repos, API, UI, tests, docs) ; le projet compile à chaque commit.
- **Jonction node_modules** : PowerShell `New-Item -ItemType Junction <worktree>\node_modules <repo>\node_modules`.
- **Jamais `mklink /J` depuis Git Bash** (MSYS mange `/J` → échec silencieux). **Jamais `npm install` dans un worktree jonctionné** (npm remplace la jonction → disque saturé) : installer dans le repo principal.
- `.env.local` copié selon `.worktreeinclude`, jamais committé.
- Typecheck dans un worktree vierge : `next typegen` PUIS `tsc --noEmit`.
- Build local sur worktree jonctionné : `next build --webpack` (Turbopack refuse une jonction `node_modules`).
- Suppression après fusion : `git worktree remove` puis `git branch -d`.