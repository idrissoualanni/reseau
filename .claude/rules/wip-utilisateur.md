---
description: Fusion d'un worktree sur `dev` quand le dépôt principal contient du WIP non commité (utilisateur). À lire avant tout merge de branche.
---
# WIP utilisateur — ne jamais l'écraser

Le dépôt principal (`dev`) contient souvent du travail non commité de l'utilisateur
(AGENTS.md, rules, render.yaml, package.json/lock, docs, fichiers untracked).
Ce WIP est volontairement laissé en l'état ; un merge de worktree ne doit rien détruire.

## Erreur vécue (2026-10-10, merge F12)

Un `git merge --ff-only <branche>` a échoué : `docs/TODO.md`, `package.json` et
`package-lock.json` étaient modifiés localement **et** par la branche à merger.
Sans précaution, git refuserait le merge ; avec un checkout forcé, le WIP serait perdu.

## Procédure obligatoire pour merger sur `dev` avec WIP

1. **Inventorier** : `git status --short` — repérer fichiers modifiés ET untracked.
2. **Mettre de côté le WIP** (y compris les untracked) :
   `git stash push -u -m "wip-dev-avant-<tache>"`.
3. **Merger** : `git merge --ff-only <branche>` (ou merge normal si non-FF).
4. **Restaurer** : `git stash pop` — résoudre les conflits éventuels.
   - `docs/` : privilégier la version mergée quand la tâche rend obsolète une
     ligne du WIP ; sinon garder les deux apports (WIP + merge) en les fusionnant.
   - `package.json` / `package-lock.json` : garder les dépendances des deux côtés
     (ex. versions pinnées du WIP + nouvelles deps de la branche).
5. **Vérifier** : plus aucun marqueur `<<<<<<<` / `>>>>>>>`, `git status` conforme,
   puis `git stash drop` UNIQUEMENT si le stash a été entièrement réappliqué.
6. Ne **jamais committer** les fichiers du WIP utilisateur au passage ; ils restent
   dans le working tree pour l'utilisateur.

## Contre-exemples

- `git checkout -- .` ou `git reset --hard` après un pop conflictuel → WIP perdu.
- Laisser un stash `wip-dev-avant-*` traîner → source de confusion ; le dropper
  une fois l'état vérifié.