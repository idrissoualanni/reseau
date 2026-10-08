---
description: Lancer les vérifications (types, lint, tests) et résumer
argument-hint: [ui | chemin]
allowed-tools: Bash(pnpm *)
---
1. Lance `pnpm typecheck`, `pnpm lint`, puis `pnpm test` (ou `pnpm test:ui` si l'argument est `ui` : indique-moi seulement l'URL, ne bloque pas le terminal).
2. Si échec : analyse la **cause** (pas le symptôme), corrige le code ou le test fautif. Interdit : supprimer/assouplir un test pour passer.
3. Résume : commandes lancées, résultat, couverture de `application/`, tests ajoutés/manquants par rapport aux critères de la fiche.
