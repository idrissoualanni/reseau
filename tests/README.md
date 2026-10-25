# Tests V1.5 Projects (F18/F19/F20)

## Structure

```
tests/
├── v15-projects-unit.test.ts          # Unit tests (Vitest) - mocked repositories
├── v15-projects-graphql.integration.test.ts  # GraphQL integration tests (requires DB)
├── v15-projects-e2e.spec.ts           # E2E tests (Playwright)
└── README.md                          # This file
```

## Lancer les tests

### Unitaires (Vitest) - rapide, sans DB
```bash
npm test -- tests/v15-projects-unit.test.ts
```

### Intégration GraphQL (nécessite Neon dev)
```bash
# Variables d'environnement requises :
# DATABASE_URL=postgresql://... (branche dev)
# KNOWLEDGE_DB_TESTS=1

npm test -- tests/v15-projects-graphql.integration.test.ts
```

### E2E (Playwright) - navigateur réel
```bash
# Installation Playwright (première fois)
npx playwright install

# Lancer les tests
npx playwright test tests/v15-projects-e2e.spec.ts

# Avec UI
npx playwright test tests/v15-projects-e2e.spec.ts --ui
```

## Couverture visée

| Fonctionnalité | Unitaires | Intégration | E2E |
|----------------|-----------|-------------|-----|
| F18 Catalogue | Filtres, curseur, validation | Query projectsV15 + filtres | Filtres, pagination, recherche |
| F19 Réactions | Toggle, unicité, draft check | Mutation add/remove | Like, celebrate, insight, curious |
| F19 Commentaires | Arborescence, parentId, draft | Mutation create/delete | Commenter, répondre, 3 niveaux |
| F19 Suivi | Follow/unfollow, draft check | Mutation follow/unfollow | Bouton, liste suiveurs |
| F20 Updates | Auteur seul, imageKey, draft | Mutation create/delete | Composer, image, suppression |
| Autorisations | ForbiddenError, NotFoundError | Vérification contexte | Auteur seulement, projet publié |

## Conventions

- **AAA pattern** : Arrange, Act, Assert
- **Mocks** : Repositories mockés via `vi.mock()`
- **Optimistic updates** : Testés dans unitaires + E2E
- **Cascade delete** : Vérifié pour reactions/comments/followers/updates
- **WebSocket** : Testé en E2E avec 2 onglets (context.newPage())

## Données de test

Les tests d'intégration/E2E nécessitent :
- Un profil de test connecté
- Un projet publié existant (`test-project-id`)
- Au moins une compétence dans le référentiel

## CI/CD

```yaml
# .github/workflows/test.yml
- name: Unit tests
  run: npm test -- tests/v15-projects-unit.test.ts

- name: Integration tests
  if: env.DATABASE_URL && env.KNOWLEDGE_DB_TESTS == '1'
  run: npm test -- tests/v15-projects-graphql.integration.test.ts

- name: E2E tests
  run: npx playwright test tests/v15-projects-e2e.spec.ts
```