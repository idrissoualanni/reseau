---
description: Nommage, style, commits, langues
---
# Conventions

- TypeScript strict. Fichiers en `kebab-case`, composants React en `PascalCase`, fonctions `camelCase`, constantes `UPPER_SNAKE_CASE`, tables SQL `snake_case` pluriel.
- Une fonction = une responsabilité, ≤ 40 lignes ; fichier ≤ 300 lignes. Commentaires : le **pourquoi**, pas le quoi.
- Imports absolus via alias `@/` (apps/web) ; `@reseau/shared`, `@reseau/db` pour les packages.
- Gestion d'erreur : lever des erreurs typées (`lib/errors.ts`), jamais renvoyer `null` pour « interdit » ou « invalide ».
- Dates en UTC ISO 8601 ; affichage localisé côté client.
- Textes utilisateur en français, centralisés (pas de chaînes dispersées dans la logique).
- Commits : Conventional Commits en anglais — `feat(scope): …`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`. Portée = module (`projects`, `profiles`, `db`, `ui`…).
- Branches : `feat/F05-create-project`, `fix/short-slug`, `hotfix/short-slug`.
- PR : titre = commit principal ; description = fiche liée, ce qui change, DoD cochée, captures mobile pour l'UI.
- Pas de code mort, pas de `TODO` sans fiche ou issue, pas de `console.log` committé.
