---
description: Vitest, Vitest UI, stratégie de tests
paths: ["**/*.test.ts", "**/*.test.tsx", "vitest.*"]
---
# Tests

- **Vitest** pour unitaires et intégration ; **Vitest UI** : `npm run test:ui` (développement). CI : `npm test` (sans UI) avec couverture.
- Fichiers `*.test.ts(x)` à côté du code testé. Un test = un comportement, nom en phrase (`it("refuse la publication sans titre")`).
- **Pyramide** : beaucoup de tests unitaires sur `application/` (repositories simulés, `ctx` explicite), quelques tests d'intégration sur `data/` (base Neon de test dédiée ou branche éphémère), un E2E par fonctionnalité clé (Playwright, ajouté quand le premier parcours complet existe).
- Chaque règle métier et chaque cas d'erreur de la fiche a un test. Critères d'acceptation → tests.
- Couverture minimale de `application/` : 80 % lignes ; ne pas viser 100 % partout.
- Tests d'autorisation obligatoires : « un autre membre ne peut pas… » pour chaque mutation.
- Pas de dépendance à l'heure, à l'aléatoire ni au réseau : injecter horloge/générateur d'identifiants.
- Interdit : supprimer ou assouplir un test pour faire passer la CI ; `it.skip` sans fiche.
- Les données de test sont créées par des fabriques (`test/factories`), jamais copiées de la production.
