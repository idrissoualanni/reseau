# Architecture

## Vue d'ensemble (V1)

```mermaid
flowchart TB
  subgraph Client["Navigateur (mobile d'abord)"]
    UI["Next.js UI (React)"]
  end
  CF["Cloudflare: DNS, CDN, WAF, Turnstile"]
  subgraph Render["Render (dev / production)"]
    WEB["reseau-web: Next.js<br/>pages, REST, GraphQL"]
  end
  subgraph Neon["Neon (branche dev / main)"]
    PG[("Postgres")]
    AUTH["Neon Auth"]
    STO["Neon Storage (S3)"]
  end
  UI -->|HTTPS| CF
  CF -->|HTTPS| WEB
  WEB -->|SQL Drizzle| PG
  WEB -->|session / sign-in| AUTH
  WEB -->|URL présignée| STO
  UI -->|PUT image présignée| STO
```

Évolution V2 : ajout de `apps/realtime` (WebSocket : messagerie, signalisation d'appels) et d'un TURN géré. Rien de cela n'est créé en V1.

## API : qui parle comment
| Domaine | Protocole | Pourquoi |
|---|---|---|
| Projets / posts (liste, détail, création, édition, publication, suppression) | **GraphQL** (`POST /api/graphql`) | Lectures composées (projet + auteur + compétences), évolutif vers le fil |
| Auth | Handler Neon Auth (`/api/auth/[...path]`) | Fourni par le SDK |
| Profil, compétences, recherche, upload | **REST** (route handlers) | Opérations simples, cacheables |
| Pages serveur (RSC) | **Appel direct aux cas d'usage** | Jamais d'appel HTTP vers soi-même |

## Couches (dans `apps/web/src`)
```
app/                  Transport : pages, route handlers, GraphQL route. Aucune logique métier.
server/graphql/       Schéma Pothos + résolveurs (appellent application/)
modules/<module>/
  components/         UI propre au module
  application/        Cas d'usage : autorisation + règles métier + orchestration
  data/               Repositories Drizzle (seule couche qui parle SQL)
  index.ts            API publique du module
lib/                  auth.ts, storage.ts, errors.ts, logger.ts, env.ts (validés par Zod)
components/ui/        shadcn/ui (seule source de composants de base)
```
Règle de dépendance (sens unique) : `app → application → data`. `components → schémas Zod` seulement. Un module n'importe un autre module que par son `index.ts`.

Modules V1 : `profiles`, `skills`, `projects`, `search`, `uploads`. (L'auth est dans `lib/auth.ts`.)

## Contrats partagés (`packages/shared`)
Schémas Zod, types, énumérations (`ProofLevel`, `ProjectStatus`) et codes d'erreur. **Contract-first** : le contrat est écrit et fusionné d'abord, ce qui permet au backend et au frontend de travailler en parallèle.

## Gestion des erreurs
Les cas d'usage lèvent des erreurs typées (`NotFound`, `Forbidden`, `Validation`, `Conflict`) définies dans `lib/errors.ts`. REST les traduit en codes HTTP (404, 403, 422, 409), GraphQL en `extensions.code`. Aucune trace d'appel renvoyée au client.

## Séquence : publier un projet avec image (F06)
```mermaid
sequenceDiagram
  autonumber
  participant U as Navigateur
  participant W as Next.js (REST/GraphQL)
  participant S as Neon Storage
  participant D as Postgres
  U->>W: POST /api/uploads/presign (type, taille)
  W-->>U: URL présignée + clé
  U->>S: PUT image (URL présignée)
  U->>W: mutation publishProject(id, coverKey)
  W->>D: UPDATE projects (statut = published)
  W-->>U: projet publié
```

## Évolutivité sans surconstruction
- Index et pagination par curseur dès la V1 (`data-model.md`).
- Images servies redimensionnées (`next/image`) et mises en cache par Cloudflare.
- Les futurs services lisent la même base via `packages/db`.
