# Tests & Qualité (Vitest)

Miroir concis de `.claude/rules/testing.md` (source autoritaire). À lire avant tout test.

- **Vitest uniquement** (`vitest.config.mts`, `environment: "node"`, alias `@` → `./src`). Playwright non installé.
- Commandes : `npm test` (CI), `npm run test:watch` (local), `npm test -- <chemin>`, `npm run lint`, `npm run typecheck`, `npm run graphql:check`. Pas de `test:ui`.
- **Worktree neuf** : `npx next typegen` **puis** `npm run typecheck` (sinon `Cannot find name 'LayoutProps'` dans `src/app/layout.tsx`).
- Disque : pas de `next build` sous ~1,5 Go ; `sh .opencode/scripts/cleanup-disk.sh`.
- Nommage colocalisé : `x.test.ts` (unitaire), `x.integration.test.ts` (intégration).
- **Intégration hors ligne par défaut** : mocker `src/lib/repositories/**` et exécuter le vrai schéma Pothos ; tester les erreurs par `extensions.code`.
- **Base réelle : opt-in seulement**, branche Neon **dev** uniquement, jamais la prod ; données fabriquées et nettoyage scopé au jeu de test.
- Traçabilité : chaque critère de `docs/features/Fxx.md` ↔ un test (`// Fxx critère n`).
- Négatifs obligatoires : `UNAUTHENTICATED` / `FORBIDDEN` / `NOT_FOUND` ; gardes admin et « dernier admin ».
- Schéma : `npm run graphql:export` puis `npm run graphql:check` ; `schema.graphql` committé, jamais édité à la main.
- Jamais supprimer/assouplir un test pour passer la CI ; aucun secret dans les tests.
