---
description: Couches, dépendances, structure des modules
paths: ["apps/**", "packages/**"]
---
# Architecture : règles de code

- Couches par module : `components/` · `application/` · `data/` ; transport dans `app/` et `server/graphql/`.
- Sens de dépendance : `app|server → application → data`. `components` n'importe que des schémas/types partagés et des appels d'API/actions.
- **SQL/Drizzle uniquement dans `data/`.** **Règles métier et autorisation uniquement dans `application/`.**
- Un cas d'usage = une fonction exportée, un fichier (`application/publish-project.ts`). Signature : `(ctx, input) => Promise<Output>` où `ctx = { userId, profileId }` vient de la session.
- Un module en importe un autre uniquement via son `index.ts`.
- Les composants serveur appellent les cas d'usage directement ; **pas d'appel HTTP vers sa propre API**.
- Schémas Zod et types dans `packages/shared` ; ne jamais redéfinir un type déjà partagé.
- Accès fournisseurs (auth, stockage) uniquement via `lib/auth.ts` et `lib/storage.ts`.
- Pas de dépendance circulaire, pas de `any`, pas d'export par défaut hors fichiers imposés par Next.js.
- Variables d'environnement lues **une seule fois** dans `lib/env.ts` (validées par Zod), jamais `process.env` ailleurs.
- Ne pas créer `apps/realtime` ni de table/dépendance d'une version future (`docs/roadmap.md`).
