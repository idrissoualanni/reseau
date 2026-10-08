---
name: vitest-testing
description: Écrire et organiser les tests Vitest (unitaires, intégration, Vitest UI). À utiliser pour tout code qui contient une règle métier ou une autorisation.
---
# Tests avec Vitest

- Lancer : `npm test` (CI), `npm run test:ui` (interface Vitest UI, dev), `npm test -- <chemin>` (ciblé).
- **Cas d'usage** : injecter `ctx` et un repository simulé ; tester le chemin nominal, chaque erreur de la fiche, et le refus d'autorisation.
- **Zod** : cas valide, limites (min/max), champ inconnu rejeté (`.strict()`).
- **Data** : tests d'intégration sur une base Neon de test (branche dédiée), données par fabriques, nettoyage après chaque test.
- **Déterminisme** : horloge et UUID injectés ; pas de réseau.
- **Nommage** : `it("refuse la publication sans titre")` ; un comportement par test.
- **Traçabilité** : chaque critère d'acceptation de la fiche correspond à au moins un test (commentaire `// Fxx critère n`).
- Corriger la cause d'un échec ; jamais supprimer/assouplir un test pour passer. Couverture `application/` ≥ 80 %.
