---
description: Fusion d'un worktree sur `dev` quand le dépôt principal contient du WIP non commité (utilisateur). Miroir de `.claude/rules/wip-utilisateur.md`.
---
# WIP utilisateur — ne jamais l'écraser

Le dépôt principal (`dev`) contient souvent du travail non commité de l'utilisateur
(AGENTS.md, rules, render.yaml, package.json/lock, docs, fichiers untracked).
Ce WIP est volontairement laissé en l'état ; un merge de worktree ne doit rien détruire.

## Procédure obligatoire pour merger sur `dev` avec WIP

1. `git status --short` — repérer fichiers modifiés ET untracked.
2. `git stash push -u -m "wip-dev-avant-<tache>"` — met de côté le WIP (untracked inclus).
3. `git merge --ff-only <branche>` (ou merge normal si non-FF).
4. `git stash pop` — résoudre les conflits :
   - `docs/` : version mergée si la tâche rend obsolète une ligne du WIP, sinon fusionner les deux ;
   - `package.json`/lock : garder les dépendances des deux côtés.
5. Vérifier (pas de marqueurs `<<<<<<<`), puis `git stash drop` si tout est réappliqué.
6. Ne **jamais committer** les fichiers du WIP utilisateur au passage.

Détails et erreur vécue : `.claude/rules/wip-utilisateur.md`.