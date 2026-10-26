# F18 — Catalogue de projets (découverte globale)

- **Version** : V1.5 · **Dépend de** : F06, F07 · **Agents** : database, backend, frontend, designer, qa
- **Objectif** : permettre à tout membre de parcourir et filtrer l'ensemble des projets publiés de la plateforme.
- **User story** : En tant que membre, je veux explorer tous les projets publiés, filtrer par compétence, type de projet et recherche texte, et découvrir des profils inspirants.

## Règles métier

1. Le catalogue liste **uniquement** les projets `status = 'published'`.
2. Tri par défaut : plus récents d'abord (`published_at DESC, id DESC`).
3. Filtres disponibles (combinables) :
   - Compétence(s) : une ou plusieurs via `project_skills` (AND)
   - Type de projet : `project_type` enum (personal, team, open_source, research, coursework)
   - Auteur : username exact
   - Recherche texte libre : trigramme sur `title || ' ' || body` (pg_trgm)
4. Pagination par curseur (tuple `published_at, id`), jamais `OFFSET`.
5. Carte de projet réutilise `ProjectCard` (F07/F08).
6. Le catalogue est accessible à tout membre connecté (pas de filtrage par espace en V1.5).

## Écrans / routes

- `/projects` (catalogue global, filtres, pagination) — Fiche UX : `docs/ux/projects-catalog.md`
- État vide : message + lien vers `/me/projects/new`
- États de chargement : skeletons (cards)
- Responsive : grille 1 col < md, 2 cols ≥ md, 3 cols ≥ lg

## API

- **GraphQL** (ADR 0002) — étend la query `projects` existante :
  ```graphql
  type Query {
    projects(
      first: Int = 20
      after: String
      skillSlugs: [String!]
      projectTypes: [ProjectType!]
      authorUsername: String
      search: String
    ): ProjectConnection!
  }

  enum ProjectType {
    PERSONAL
    TEAM
    OPEN_SOURCE
    RESEARCH
    COURSEWORK
  }
  ```

## Données

- Tables existantes : `projects`, `project_skills`, `skills`
- **Nouvelle colonne** (additive, migration V1.5) :
  ```sql
  ALTER TABLE projects ADD COLUMN project_type project_type_enum DEFAULT 'personal';
  CREATE TYPE project_type_enum AS ENUM ('personal', 'team', 'open_source', 'research', 'coursework');
  ```
- **Index additifs** (migration V1.5) :
  ```sql
  CREATE INDEX projects_search_trgm ON projects USING gin ((title || ' ' || body) gin_trgm_ops);
  CREATE INDEX projects_type_idx ON projects (project_type) WHERE status = 'published';
  CREATE INDEX projects_published_type_idx ON projects (published_at DESC, id DESC) WHERE status = 'published' AND project_type = 'team';
  -- Index partiels par type pour performance filtres
  ```

## Validation (Zod)

- `search` : string, max 100 caractères, pas de `<>`, trim
- `skillSlugs` : array de slugs existants (max 5), normalisés
- `projectTypes` : array de valeurs `ProjectType` enum
- `authorUsername` : username existant (vérifié en DB)

## Erreurs

| Cas | Code | Message |
|---|---|---|
| Recherche vide | VALIDATION | "Le terme de recherche ne peut pas être vide." |
| Compétence inconnue | VALIDATION | "Compétence introuvable." |
| Type projet invalide | VALIDATION | "Type de projet invalide." |
| Auteur inconnu | VALIDATION | "Membre introuvable." |
| Trop de filtres compétences | VALIDATION | "Maximum 5 compétences pour le filtre." |

## Sécurité et autorisation

- Seul membre connecté (session valide)
- Aucune donnée privée exposée (email, user_id Neon Auth)
- Rate limiting sur la query (20 req/min par IP)
- Validation côté serveur de tous les filtres

## Critères d'acceptation

- [ ] Given un membre connecté, When il accède à `/projects`, Then il voit la liste paginée des projets publiés.
- [ ] Given un filtre compétence, When il sélectionne une compétence, Then seuls les projets tagués cette compétence apparaissent.
- [ ] Given un filtre type projet, When il sélectionne "team", Then seuls les projets de type team apparaissent.
- [ ] Given une recherche texte, When il soumet, Then les projets correspondants (titre/body) apparaissent via trigramme.
- [ ] Given des filtres combinés, When il applique, Then les résultats respectent tous les filtres (AND).
- [ ] Given la fin de page, When il clique "Voir plus", Then la page suivante charge sans rechargement.
- [ ] Given aucun projet, When il accède au catalogue, Then un état vide avec CTA s'affiche.

## Tests attendus

- Unitaires : validation, construction du curseur, filtres combinés, index partiels
- Intégration : query GraphQL avec filtres combinés, index trigramme, performance < 300ms
- E2E : navigation catalogue → filtres multiples → pagination → détail projet

## Hors périmètre

- Filtrage par espace (espaces = V1.5 séparé, F14/F15)
- Tri par popularité / likes (F19)
- Recherche géographique / établissement (V2+)
- Sauvegarde de filtres / alertes email (V2+)
- Feed unifié posts + projets (décision : séparés)

## Questions ouvertes

1. Performance index trigramme sur gros volume : tester avec 10k+ projets.
2. Filtres compétences : AND (toutes) ou OR (au moins une) ? Décision : AND pour précision.