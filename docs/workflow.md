# Procédure des agents (de l'idée au déploiement)

Applicable à toute tâche : nouvelle fonctionnalité, évolution, correction. Les commandes `/brainstorm`, `/plan`, `/build`, etc. automatisent ces étapes.

## Cycle obligatoire
```
0 Comprendre → 1 Brainstorm (si flou) → 2 Fiche (spec) → 3 Fiche UX (si écran) → 4 Plan (mode plan)
→ ⛔ VALIDATION HUMAINE → 5 Worktree → 6 Construction par couches → 7 Auto-revue (DoD)
→ 8 Revue croisée → 9 PR vers dev → 10 Validation sur dev → 11 Release dev→main → 12 Changelog
```

| # | Étape | Sortie | Qui |
|---|---|---|---|
| 0 | Lire `CLAUDE.md`, la fiche `features/Fxx`, `roadmap.md`. Vérifier que la tâche est dans la version en cours | Compréhension en 5 lignes | tous |
| 1 | `/brainstorm` : questions, options, risques, hors-périmètre. Une question à la fois | Notes dans la conversation, décision | architect |
| 2 | Fiche de fonctionnalité (`docs/features/_template.md`) : objectif, règles, critères d'acceptation | `docs/features/Fxx-*.md` | architect |
| 3 | Fiche UX avant tout code d'écran (`docs/ux/_template.md`) : utilisateur, parcours, états, mobile, accessibilité | `docs/ux/<page>.md` | designer |
| 4 | `/plan` en **mode plan** (lecture seule) : contrat, tâches par couche, fichiers touchés, tests, risques | `docs/plans/AAAA-MM-JJ-<slug>.md` | architect |
| ⛔ | **L'humain valide le plan.** Sans validation, aucune écriture de code | « Plan approuvé » | humain |
| 5 | `/build` crée le worktree `feat/Fxx-slug` | worktree | devops |
| 6 | Construction **dans cet ordre** : contrat (`packages/shared`) → schéma + migration → `data` → `application` → `api` → `ui` → tests | commits conventionnels | database, backend, frontend, qa |
| 7 | Auto-revue avec la Définition de « terminé » ci-dessous | cases cochées dans la PR | agent auteur |
| 8 | Revue croisée : `security` (autorisation, validation, upload), `qa` (tests, critères), `docs` (doc/CHANGELOG) | commentaires, corrections | autres agents |
| 9 | PR `feat/*` → `dev` ; CI verte | PR | devops |
| 10 | Déploiement auto sur dev ; validation manuelle avec les critères d'acceptation | feu vert humain | humain |
| 11 | `/release` : PR `dev` → `main`, tag SemVer | production | devops |
| 12 | `/changelog` met à jour `CHANGELOG.md` | entrée datée | docs |

## Définition de « terminé » (DoD)
- [ ] Critères d'acceptation de la fiche tous cochés
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` verts ; tests ajoutés pour chaque règle métier et chaque cas d'erreur
- [ ] Autorisation vérifiée dans `application/` ; entrées validées par Zod
- [ ] États UI : chargement, vide, erreur, succès ; testé à 360 px de large
- [ ] Migration générée, relue, rejouable ; aucune table hors version
- [ ] Docs concernées + `CHANGELOG.md` à jour
- [ ] Aucun secret, aucun `console.log` de donnée personnelle, aucun code mort
- [ ] Validé sur `dev`

## Git
- Branches : `main` (production), `dev` (intégration/validation), `feat/Fxx-slug`, `fix/slug`, `hotfix/slug`.
- Commits : Conventional Commits (`feat(projects): publish a project`). Petits, fréquents.
- Jamais de commit direct sur `main`/`dev`, jamais de `push --force`. Le hook `guard-git.sh` l'impose.
- Worktrees : un dossier frère `../reseau-worktrees/<branche>`. Supprimer le worktree après merge.

## Propriété des fichiers (évite les conflits entre agents parallèles)
| Agent | Possède | Ne touche pas |
|---|---|---|
| architect | `docs/`, `docs/decisions/`, `docs/plans/` | code |
| database | `packages/db/**` | `apps/web/**` |
| backend | `apps/web/src/{modules/*/application,modules/*/data,server,app/api}`, `packages/shared` | `components/**` |
| frontend | `apps/web/src/{app/(pages),modules/*/components,components}` | `application/`, `data/` |
| designer | `docs/design-system.md`, `docs/ux/`, `globals.css`, tokens | logique métier |
| qa | `**/*.test.ts(x)`, `vitest.config.*`, e2e | code de production (signale seulement) |
| security | lecture seule + rapports | — |
| devops | `render.yaml`, `.github/`, scripts, `.claude/hooks` | code métier |
| docs | `CHANGELOG.md`, `docs/*.md` hors décisions | code |
Si une tâche exige de toucher un dossier d'un autre agent : demander via le plan, ne pas contourner.

## Parallélisme
Backend et frontend travaillent en parallèle **après** fusion du contrat (`packages/shared`) et du schéma GraphQL/REST. Un worktree par agent actif, une branche par tâche.

## Frontend : travailler de façon cohérente
1. Lire `docs/design-system.md` et la fiche UX de la page.
2. Réutiliser uniquement `components/ui` et les tokens ; ne jamais coder une couleur ou un espacement en dur.
3. Gabarits de page communs (`PageShell`, `EmptyState`, `ErrorState`, `Skeleton`).
4. Si un composant manque : le demander au designer (ajout à `components/ui` + doc), pas de variante locale.

## Quand s'arrêter et demander
Fiche ambiguë, périmètre qui déborde la version, décision d'architecture non couverte, risque de perte de données. Poser **une** question précise, avec une recommandation.
