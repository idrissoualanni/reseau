---
description: Vitest, Vitest UI, stratégie de tests, conventions et bonnes pratiques
paths: ["**/*.test.ts", "**/*.test.tsx", "vitest.*"]
---
# Tests & Qualité

## 1. Outils et Stratégie Globale (Pyramide des tests)
- **Stack principale :** **Vitest** pour les tests unitaires et d'intégration. **Playwright** pour le E2E.
- **Workflow de développement :** Utiliser `npm run test:ui` en local pour un feedback visuel et rapide.
- **Intégration Continue (CI) :** Utiliser `npm test` (sans UI). La CI bloque tout déploiement si un test échoue ou si la couverture minimale n'est pas atteinte.
- **Pyramide stricte :** 
  - **Unitaires (70%) :** Exécution ultra-rapide sur la couche `application/` et `domain/`. Isolez le code avec des mocks/stubs pour les dépendances externes (bases de données, API tierces).
  - **Intégration (20%) :** Validation des interactions avec les systèmes réels (couche `data/`, requêtes SQL). Utilise une base Neon de test dédiée ou une branche éphémère.
  - **End-to-End (10%) :** Un test E2E par fonctionnalité clé/parcours utilisateur critique (ajouté dès que le premier "Happy Path" est fonctionnel).

## 2. Organisation et Nommage
- **Colocation :** Les fichiers de test `*.test.ts(x)` doivent se trouver dans le même dossier, juste à côté du fichier testé (ex: `user.service.ts` -> `user.service.test.ts`).
- **Structure BDD (Behavior-Driven Development) :** 
  - Utiliser `describe` pour définir le contexte ou la méthode testée.
  - Utiliser `it` pour décrire le comportement attendu sous forme de phrase active.
  - *Bon exemple :* `describe('Publication d'article')` -> `it('refuse la publication si le titre est manquant')`.
  - *Mauvais exemple :* `it('test publish fail')`.
- **Principe d'unicité :** Un test = un comportement = une assertion principale (ou un groupe logique d'assertions liées au même état).

## 3. Écriture des Tests (Règles d'Or)
- **Motif AAA (Arrange, Act, Assert) :** Séparer visuellement chaque phase par un saut de ligne.
  1. *Arrange :* Préparation des données et du contexte (mocks, factories).
  2. *Act :* Appel de la fonction/méthode.
  3. *Assert :* Vérification des résultats et des effets de bord.
- **Traçabilité des spécifications :** Chaque règle métier (critère d'acceptation de la fiche/ticket) et chaque cas d'erreur explicite doit avoir son test correspondant.
- **Déterminisme absolu :** Aucun test ne doit dépendre de l'heure du système, d'une génération aléatoire non contrôlée, ou du réseau externe.
  - *Horloge :* Utiliser `vi.setSystemTime()` ou injecter un fournisseur de date.
  - *Aléatoire/UUID :* Injecter un générateur prédictible ou mocker les modules de génération (ex: `crypto.randomUUID`).
- **Interdiction de contournement :** Il est strictement interdit de supprimer, de commenter, ou de modifier un test légitime uniquement pour "faire passer la CI". L'utilisation de `it.skip` ou `describe.skip` est tolérée **uniquement** si elle est accompagnée d'un commentaire contenant le lien vers le ticket/fiche de résolution.

## 4. Tests d'Intégration et Données
- **Isolation des tests :** Chaque test d'intégration doit s'exécuter dans un état propre. La base de données doit être nettoyée entre chaque test (utiliser `beforeEach` ou `afterEach` pour tronquer les tables, et non les supprimer).
- **Gestion des données :** 
  - **Obligatoire :** Les données de test doivent être générées via des **fabriques (factories)** (dans `test/factories`), afin de masquer la complexité de création et garantir des données valides par défaut.
  - **Interdit :** Ne jamais copier/utiliser d'exports de la base de données de production.
- **Transactions :** Si la base de données le supporte, enveloppez chaque test d'intégration dans une transaction SQL qui fait un `ROLLBACK` à la fin, pour garantir des tests rapides sans écrire physiquement sur le disque.

## 5. Sécurité et Autorisations
- **Tests négatifs par défaut :** Pour toute mutation (création, mise à jour, suppression) ou accès à une ressource protégée, un test d'interdiction est obligatoire.
- **Cas à couvrir systématiquement :**
  - "Un utilisateur non authentifié reçoit une erreur 401."
  - "Un membre n'ayant pas les droits/rôles suffisants reçoit une erreur 403."
  - "Un membre ne peut pas modifier la ressource appartenant à un autre membre."

## 6. Couverture de Code (Code Coverage)
- **Couverture intelligente :** Le seuil minimal exigé pour la couche métier (`application/` et `domain/`) est de **80% des lignes et des branches**.
- **Pas de dogmatisme :** Ne pas viser 100% aveuglément au détriment de la qualité des tests. Les fichiers de configuration, les déclarations de types purs et les scripts de migration peuvent être exclus du rapport de couverture.