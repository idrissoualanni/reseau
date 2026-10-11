---
description: Vitest (unitaires, intégration, schéma GraphQL), stratégie, conventions et vérifications
paths: ["**/*.test.ts", "**/*.test.tsx", "**/*.integration.test.ts", "vitest.*"]
---
# Tests & Qualité

Source autoritaire. Miroir OpenCode : `.opencode/rules/testing.md`.

## 1. Outils
- **Vitest uniquement** (`vitest.config.mts`, `environment: "node"`, alias `@` → `./src`). Playwright **non installé** : pas d'E2E pour l'instant (voir `docs/backlog.md`).
- Scripts : `npm test` (= `vitest run`, CI) ; `npm run test:watch` (local) ; `npm test -- <chemin>` (ciblé) ; `npm run lint` ; `npm run typecheck` ; `npm run graphql:check`.
- Pas de `npm run test:ui` (Vitest UI non installé).
- **Worktree neuf** : `npx next typegen` **puis** `npm run typecheck`. Sans `next typegen`, `tsc` échoue sur `Cannot find name 'LayoutProps'` (`src/app/layout.tsx`) — type global généré par Next 16.
- **Disque** : ne pas lancer `next build` sous ~1,5 Go libre. Nettoyage : `sh .opencode/scripts/cleanup-disk.sh`.

## 2. Pyramide (adaptée au projet)
- Unitaires (~70 %) : cas d'usage de `src/lib/**` avec repository injecté/simulé.
- Intégration (~20 %) : plusieurs couches à la fois (validation → cas d'usage → mapper/schéma). **Hors ligne par défaut** : mocke `src/lib/repositories/**` et exécute le vrai schéma Pothos (`src/server/graphql/**`).
- E2E (0 % aujourd'hui) : Playwright non installé.

## 3. Organisation et nommage
- Colocalisation à côté du code testé : `x.ts` → `x.test.ts` (unitaire) ou `x.integration.test.ts` (intégration).
- `describe` = contexte/méthode ; `it` = phrase active. Ex. : `it("refuse un commentaire racine sans contenu")`.
- Un test = un comportement = une assertion principale (ou groupe cohérent d'assertions liées au même état).

## 4. Motif AAA et déterminisme
- Arrange / Act / Assert séparés par une ligne vide.
- Horloge : `vi.setSystemTime()` ou injection ; UUID : injecter ou mocker `crypto.randomUUID`. Aucun réseau externe.
- Zod v4 : un champ `.nullable()` refuse `undefined` ; passer `null` (`?? null`, pas `?? undefined`).

## 5. Traçabilité des fiches
- Chaque critère d'acceptation de `docs/features/Fxx.md` a au moins un test (commentaire `// Fxx critère n`).
- Toute évolution de comportement met le test à jour **avant** ou **avec** le code.

## 6. Tests d'intégration et données
- **Hors ligne d'abord** (repos mockés + vrai schéma) : voie par défaut de la CI, aucune base requise.
- **Base réelle : opt-in uniquement** : `DATABASE_URL` **+** drapeau dédié ; uniquement la branche Neon **dev** (`NEON_BRANCH=dev`) ; **jamais la production**.
- Données via fabriques ; nettoyage **scopé** au jeu de test (jamais une table entière, jamais une ressource existante). Ne jamais copier d'export de production.

## 7. Sécurité et autorisations
- Un test négatif obligatoire pour toute mutation ou ressource protégée : non authentifié → `UNAUTHENTICATED` (401) ; droits insuffisants → `FORBIDDEN` (403) ; ressource invisible → `NOT_FOUND`.
- Couvrir les gardes sensibles : admin plateforme, « dernier admin », accès espace.

## 8. GraphQL
- Après tout changement de schéma : `npm run graphql:export` (écrit `schema.graphql`) puis `npm run graphql:check` (test d'export). `schema.graphql` est committé, jamais édité à la main.
- Tester les erreurs par `extensions.code`, jamais par le message.

## 9. Couverture
- Cible : ≥ 80 % lignes/branches sur les cas d'usage (`src/lib/**`). Config, types purs et scripts peuvent être exclus.
- Ne pas viser 100 % au détriment de la qualité des tests.

## 10. Interdits
- Supprimer, commenter ou assouplir un test légitime pour passer la CI.
- `it.skip` / `describe.skip` sans commentaire de justification (fiche/ticket).
- Aucun secret en clair dans un test, un log ou un commit.
