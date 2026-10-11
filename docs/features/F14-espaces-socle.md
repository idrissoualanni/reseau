# F14 — Espaces (socle)

- **Version** : V1.5 · **Dépend de** : F03 · **Agents** : database, backend, frontend, designer
- **Objectif** : créer des espaces (université, filière, thème) avec membres et règles.
- **User story** : En tant qu'admin plateforme, je veux créer et configurer un espace, afin
  d'organiser la communauté autour d'un établissement ou d'un thème.

## Règles métier

1. Un espace porte un `type` (`university`, `department`, `theme`), un `slug` unique, un
   `name`, une `description` optionnelle et une `visibility` (`public`, `private`).
2. `slug` : 3–40 caractères, `[a-z0-9-]`, unique, non réservé.
3. Le cœur ignore le type : toute donnée spécifique vit dans `spaces.metadata` (jsonb).
4. Seul un `platform_admin` crée, modifie ou archive un espace (délégation en F16/F17).
5. Archiver (`archived_at`) retire l'espace des listes sans supprimer membres ni contenu.
6. Lecture : un espace `public` est visible de tout utilisateur connecté ; un espace
   `private` n'est visible que de ses membres et des admins plateforme (`NOT_FOUND` sinon).
7. Les méthodes d'accès sont une configuration séparée (F15) ; un espace en possède au
   moins une active.

## Écrans / routes

| Route | État |
|---|---|
| `/spaces` | liste des espaces publics (connecté) |
| `/spaces/[slug]` | détail : description + membres ; fil = F18 |
| `/admin/spaces` | console d'administration (voir `docs/ux/admin-plateforme.md`) |

## API

REST (`.claude/rules/api-rest.md`).

| Méthode | Route | Entrée | Sortie |
|---|---|---|---|
| `GET` | `/api/spaces` | — | liste des espaces publics |
| `GET` | `/api/spaces/[slug]` | — | détail d'un espace visible |
| `GET` | `/api/admin/spaces` | — | liste complète (archivés inclus) |
| `POST` | `/api/admin/spaces` | `createSpaceSchema` | espace créé (201) |
| `PATCH` | `/api/admin/spaces/[id]` | `updateSpaceSchema` | espace mis à jour |
| `DELETE` | `/api/admin/spaces/[id]` | — | espace archivé (204) |

## Données

`spaces` (`docs/data-model.md`).

## Validation (Zod)

`src/lib/validation/space.ts` — `createSpaceSchema`, `updateSpaceSchema`, `spaceSlugSchema`.

## Erreurs

| Cas | Code | Message |
|---|---|---|
| slug invalide / réservé | `VALIDATION` | « Ce nom d'espace n'est pas disponible. » |
| slug déjà pris | `CONFLICT` | « Un espace utilise déjà ce slug. » |
| espace inexistant | `NOT_FOUND` | « Espace introuvable. » |
| non admin plateforme | `FORBIDDEN` | « Accès refusé. » |

## Sécurité et autorisation

- Création / édition / archive : `platform_admin` uniquement, vérifié **côté serveur**.
- Lecture privée : membre ou admin plateforme, sinon `NOT_FOUND` (jamais `FORBIDDEN`).
- Aucun `userId` lu depuis la requête : identité issue de la session.

## Critères d'acceptation

- [ ] Given un platform_admin, When il crée un espace valide, Then l'espace apparaît en base.
- [ ] Given un slug déjà utilisé, When on crée, Then `CONFLICT`.
- [ ] Given un membre non admin, When il appelle `POST /api/admin/spaces`, Then `FORBIDDEN`.
- [ ] Given un espace `private`, When un non-membre le demande, Then `NOT_FOUND`.
- [ ] Given un espace archivé, When on liste les publics, Then il n'apparaît pas.

## Tests attendus

- Unitaires : validation (`space.test.ts`), cas d'usage (`admin.test.ts`, repos mockés).
- Intégration : `spaces` (opt-in `DATABASE_URL`), cf. `src/db`.

## Hors périmètre

Statistiques d'insertion (V3), sous-espaces, thématiques avancées, fil de l'espace (F18),
méthodes d'accès (F15).
