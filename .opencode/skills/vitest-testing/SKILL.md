---
name: vitest-testing
description: Écrire et organiser les tests Vitest (unitaires, intégration, schéma GraphQL). À utiliser pour tout code qui contient une règle métier ou une autorisation.
---
# Tests avec Vitest

- Lancer : `npm test` (CI) ; `npm run test:watch` (local) ; `npm test -- <chemin>` (ciblé). Pas de `test:ui` (non installé).
- **Worktree neuf** : `npx next typegen` **puis** `npm run typecheck` (sinon `LayoutProps` introuvable).
- **Cas d'usage** : injecter `ctx` et un repository simulé ; tester le chemin nominal, chaque erreur de la fiche, et le refus d'autorisation.
- **Intégration hors ligne** : mocker `src/lib/repositories/**` et exécuter le vrai schéma Pothos ; nommer `*.integration.test.ts` ; vérifier `extensions.code`.
- **Zod** : cas valide, limites (min/max), champ inconnu rejeté (`.strict()`) ; Zod v4 refuse `undefined` sur un champ `.nullable()` (passer `null`).
- **Data** : base réelle en opt-in seulement, branche Neon **dev**, jamais la prod ; fabriques + nettoyage scopé.
- **Déterminisme** : horloge et UUID injectés ; pas de réseau.
- **Nommage** : `it("refuse un commentaire racine sans contenu")` ; un comportement par test.
- **Traçabilité** : chaque critère d'acceptation de la fiche ↔ un test (commentaire `// Fxx critère n`).
- Corriger la cause d'un échec ; jamais supprimer/assouplir un test pour passer. Couverture `src/lib/**` (cas d'usage) ≥ 80 %.
