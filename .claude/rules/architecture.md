---
description: Couches, dépendances, structure des modules, conventions de code
paths: ["apps/**", "packages/**"]
---
# Architecture : règles de code

> Cette règle s'applique à tout le code du monorepo (`apps/**`, `packages/**`).
> Elle est la **source de vérité** sur « où mettre quoi » et « qui a le droit d'importer qui ».
> Lire aussi : `rest.md`, `graphql.md`, `security.md`, `testing.md`, `docs/roadmap.md`.
> En cas de doute entre cette règle et une autre : cette règle gagne sur la structure, les règles de transport gagnent sur le format des échanges.

---

## 1. Principe directeur

Le code est organisé en **couches** à l'intérieur de **modules** métier. Chaque couche a **une seule responsabilité** et ne peut dépendre que de la couche située en dessous.

> Le test à se poser avant d'écrire une ligne : **« De quelle couche est-ce la responsabilité ? »**
> Si la réponse est « un peu des deux », le code est mal découpé.

Pourquoi : un agent de codage (ou un humain) doit pouvoir modifier une règle métier sans toucher au SQL, changer une requête sans toucher aux écrans, et ajouter un point d'entrée (REST, GraphQL, page) sans réécrire la logique.

---

## 2. Structure du dépôt

```
reseau/
├── apps/
│   └── web/                          Application Next.js (seule app en V1)
│       ├── src/
│       │   ├── app/                  TRANSPORT : pages, layouts, route handlers (app/api/**)
│       │   ├── server/
│       │   │   └── graphql/          TRANSPORT : schéma Pothos, résolveurs, Yoga
│       │   ├── modules/              MÉTIER : un dossier par domaine (voir section 5)
│       │   │   ├── profile/
│       │   │   ├── skills/
│       │   │   ├── projects/
│       │   │   └── search/
│       │   └── lib/                  Infrastructure transverse (env, auth, storage, db, api)
│       └── schema.graphql            SDL committé (voir graphql.md)
├── packages/
│   └── shared/                       Schémas Zod, types, constantes partagés (front + back)
├── docs/                             Documentation, ADR, roadmap
└── .claude/                          Règles, skills, commandes, agents
```

- **Un seul `apps/web` en V1.** Pas de `apps/realtime` ni autre app (voir section 15).
- `modules/` contient la logique métier **par domaine**. `app/` et `server/graphql/` ne contiennent **aucune** logique métier.
- `lib/` contient l'infrastructure (connexion base, auth, stockage, env, utilitaires HTTP). Ce n'est **pas** un fourre-tout (voir section 12).

---

## 3. Les quatre couches

| Couche | Dossier | Responsabilité | A le droit d'importer | Interdit |
|---|---|---|---|---|
| **Transport** | `app/`, `server/graphql/` | Traduire HTTP/GraphQL/pages vers des appels de cas d'usage | `application/` (via `index.ts`), `packages/shared`, `lib/` | SQL, Drizzle, règles métier, autorisation |
| **Application** | `modules/*/application/` | Règles métier, autorisation, orchestration, transactions | `data/` (du même module), autres modules via `index.ts`, `packages/shared`, `lib/auth.ts`, `lib/storage.ts` | HTTP (`Request`, `Response`, `NextRequest`), React, accès direct à Drizzle |
| **Data** | `modules/*/data/` | Accès base de données : requêtes Drizzle, mapping ligne → entité | `lib/db.ts`, schéma Drizzle, `packages/shared` | Règles métier, autorisation, appels à `application/`, appels HTTP |
| **Components** | `modules/*/components/` | Interface React : affichage, interactions, formulaires | `packages/shared` (schémas/types), appels d'API ou d'actions, composants UI | Import de `application/` ou `data/`, `process.env`, SQL |

Les **composants serveur** (Server Components) vivent dans `app/` (transport) : ils ont le droit d'appeler directement un cas d'usage (section 9).

---

## 4. Sens de dépendance

```
        app/  ──────┐
                    ├──►  application/  ──►  data/  ──►  base de données (Neon)
 server/graphql/ ───┘          │
                               └──►  lib/auth.ts, lib/storage.ts

 components/  ──►  packages/shared (types, schémas) + appels API/actions
                   (JAMAIS vers application/ ni data/)

 tout le monde  ──►  packages/shared  (qui ne dépend de personne)
```

Règles :
- **Jamais de remontée** : `data/` n'importe jamais `application/` ; `application/` n'importe jamais `app/` ni `server/`.
- `components/` est **isolé** de la logique serveur. Il parle au serveur par API ou actions serveur, comme un client externe.
- `packages/shared` ne dépend d'**aucun** autre dossier du dépôt (seulement de `zod`).
- **Aucune dépendance circulaire**, entre fichiers comme entre modules.

---

## 5. Structure d'un module

Chaque domaine métier est un dossier de `apps/web/src/modules/`. Exemple, le module `projects` :

```
modules/projects/
├── components/                 Interface (React)
│   ├── project-card.tsx
│   ├── project-form.tsx
│   └── project-list.tsx
├── application/                Cas d'usage (un fichier = une fonction)
│   ├── create-project.ts
│   ├── publish-project.ts
│   ├── list-projects.ts
│   ├── get-project.ts
│   └── errors.ts               Erreurs métier propres au module (optionnel)
├── data/                       Accès base de données
│   ├── project-repository.ts   Fonctions de lecture/écriture Drizzle
│   └── project-mapper.ts       Ligne de base → entité du module
├── index.ts                    API publique du module (seul point d'entrée)
└── README.md                   (optionnel) rôle du module en 5 lignes
```

- Le **schéma Drizzle** (définition des tables) vit dans `apps/web/src/lib/db/schema/` (un fichier par module), pas dans `data/`. `data/` l'utilise, ne le définit pas.
- Les **tests** sont à côté du code : `publish-project.test.ts` à côté de `publish-project.ts`.
- Un module sans interface n'a pas de `components/` (ne pas créer de dossiers vides).

---

## 6. Cas d'usage (couche `application/`)

C'est **le cœur du projet**. Toute fonctionnalité est un cas d'usage.

**Règles**
- **Un cas d'usage = une fonction exportée, un fichier**, nom du fichier en kebab-case verbe-nom : `application/publish-project.ts`.
- **Signature unique** : `(ctx, input) => Promise<Output>`.
  - `ctx = { userId, profileId }` vient **toujours de la session** (jamais du client).
  - `input` est déjà **validé** (Zod) par la couche transport. Le cas d'usage ne revalide pas la forme, mais **vérifie les règles métier**.
  - `Output` est une **entité du domaine** (pas un DTO HTTP, pas une ligne brute de base).
- C'est ici, et **uniquement ici**, que vivent : règles métier, **autorisation** (« cet utilisateur a-t-il le droit ? »), vérification de propriété, orchestration de plusieurs repositories, **transactions**.
- Un cas d'usage **ne connaît pas HTTP** : il ne renvoie pas de code de statut, ne lit pas d'en-tête, ne manipule pas `Request`/`Response`.
- Il signale les échecs en **levant une erreur métier typée** (section 13) ; la couche transport la convertit.
- Un cas d'usage peut appeler un autre module **via son `index.ts`** uniquement (section 8).

**Exemple**

```ts
// modules/projects/application/publish-project.ts
import type { UseCaseContext } from "@/lib/context";
import { NotFoundError, RuleViolationError } from "@/lib/errors";
import { projectRepository } from "../data/project-repository";
import type { Project } from "@reseau/shared";

export async function publishProject(
  ctx: UseCaseContext,
  input: { projectId: string },
): Promise<Project> {
  // 1. Charger en filtrant sur le propriétaire (autorisation par construction)
  const project = await projectRepository.findOwnedById(input.projectId, ctx.profileId);
  if (!project) throw new NotFoundError("Projet introuvable");

  // 2. Règle métier
  if (project.status === "published") throw new RuleViolationError("Projet déjà publié");
  if (!project.title || !project.description) {
    throw new RuleViolationError("Titre et description requis pour publier");
  }

  // 3. Écrire et renvoyer l'entité
  return projectRepository.markPublished(project.id);
}
```

**Le type `UseCaseContext`** est défini une fois dans `lib/context.ts` :
```ts
export type UseCaseContext = { userId: string; profileId: string };
```
Il est construit par `buildContext(session)` dans la couche transport. Un cas d'usage qui n'a pas encore de profil (ex. `createProfile`) reçoit un contexte réduit `{ userId }` : le type est alors `AuthContext`, déclaré dans le même fichier.

---

## 7. Couche données (`data/`)

- **SQL et Drizzle uniquement ici.** Aucun import de `drizzle-orm` ni de `lib/db` en dehors de `data/`.
- Une **fonction par requête**, nommée par son intention : `findOwnedById`, `listPublishedByCursor`, `searchBySkill`, `markPublished`. Pas de « repository générique ».
- Les repositories **ne décident rien** : pas de règle métier, pas d'autorisation. Ils exécutent. Exception : le **filtre de propriété** dans la requête (`WHERE owner_id = ...`) est autorisé et recommandé, car il est appliqué sur ordre du cas d'usage.
- Le **mapping ligne → entité** est fait dans `data/` : les types de lignes Drizzle **ne sortent pas** de la couche. `application/` ne manipule que des entités du domaine.
- Les **transactions** sont ouvertes par le cas d'usage. Le repository reçoit un paramètre optionnel `tx` pour participer à la transaction en cours.
- **Pas de N+1** : les requêtes de liste récupèrent leurs relations en une requête (jointure ou `inArray`). Pour GraphQL, voir DataLoader dans `graphql.md`.
- **Index** : toute requête de recherche ou de tri doit s'appuyer sur un index défini dans le schéma (ex. recherche d'étudiants par compétence). Une requête sans index sur une grande table est refusée en revue.
- **Migrations** : générées par Drizzle Kit, **jamais éditées à la main** après commit ; une migration par changement de schéma (voir `docs/database.md`).

---

## 8. Communication entre modules

- Un module n'en importe un autre **que via son `index.ts`**. Jamais d'import profond (`modules/profile/data/...` depuis `projects`).
- Ce que `index.ts` exporte = **l'API publique** du module : cas d'usage, types, composants destinés à l'extérieur. Tout le reste est privé.
- Exemple correct : `import { getPublicProfile } from "@/modules/profile";`
- Exemple interdit : `import { profileRepository } from "@/modules/profile/data/profile-repository";`
- **Pas de dépendance circulaire entre modules.** Si A a besoin de B et B de A, c'est qu'il manque un troisième module ou qu'un concept est mal placé : on extrait.
- Sens habituel : `projects`, `search` peuvent dépendre de `profile` et `skills` ; `profile` ne dépend d'aucun autre module métier.

---

## 9. Couche transport (`app/` et `server/graphql/`)

**REST (`app/api/**`)**
- Un handler : session → validation Zod → **un** cas d'usage → réponse. Détails dans `rest.md`.
- Le handler construit le `ctx` à partir de la session (`buildContext`) et le passe au cas d'usage.

**GraphQL (`server/graphql/`)**
- Résolveurs **minces** : ils construisent le `ctx`, appellent **un** cas d'usage, renvoient le résultat. Détails dans `graphql.md`.

**Pages et composants serveur (`app/**/page.tsx`, `layout.tsx`)**
- Ils **appellent directement les cas d'usage** (import depuis `index.ts` du module). **Interdit : faire un `fetch` HTTP vers sa propre API** (`/api/...`) depuis le serveur : c'est lent, fragile et contourne le typage.
- Une page récupère la session, construit le `ctx`, appelle un ou plusieurs cas d'usage, et passe le résultat aux composants.

**Actions serveur (Server Actions)**
- Autorisées pour les formulaires. Même règle qu'un handler : session → validation Zod → **un** cas d'usage → résultat.
- Elles vivent dans `app/` (ou à côté de la page), pas dans `components/`.

**Composants clients (`components/`)**
- Ils reçoivent des données par props, ou appellent l'API REST/GraphQL/actions serveur.
- Ils n'importent **jamais** `application/` ni `data/`, ni `lib/db`, ni `lib/env`.
- Formulaires : validation côté client avec **le même schéma Zod** que le serveur (`packages/shared`), pour un retour immédiat. Le serveur **revalide toujours**.

---

## 10. Paquet partagé (`packages/shared`)

- Contient : **schémas Zod**, **types TypeScript** dérivés (`z.infer`), constantes métier (limites, énumérations), codes d'erreur.
- **Source unique** : ne **jamais** redéfinir un type ou un schéma déjà présent dans `packages/shared`. On l'importe.
- Les types de sortie (entités, DTO) sont **dérivés des schémas** quand c'est possible, pour éviter toute divergence.
- N'importe **rien** d'autre du dépôt. Pas de dépendance à React, Next.js, Drizzle ni Node.
- Organisation : `packages/shared/src/schemas/<ressource>.ts`, `types/`, `constants/`, `index.ts`.
- Un changement dans `shared` peut casser plusieurs endroits : il passe `npm run typecheck` sur tout le monorepo avant fusion.

---

## 11. Fournisseurs externes (auth, stockage)

- **Authentification (Neon Auth)** : accessible **uniquement** via `lib/auth.ts` (`getSession`, `requireSession`, `buildContext`). Aucun import direct du SDK dans un module, une page ou un composant.
- **Stockage (fichiers/images)** : accessible **uniquement** via `lib/storage.ts` (`createUploadUrl`, `deleteObject`, `getPublicUrl`).
- **Base de données** : connexion créée **une seule fois** dans `lib/db.ts`, utilisée par `data/` uniquement.
- **E-mail** (vérification) : via `lib/mail.ts` si besoin d'appeler le service directement.
- Pourquoi : changer de fournisseur (ou de méthode de vérification, voir cadrage) doit toucher **un fichier**, pas cinquante.
- Toute nouvelle intégration externe = un nouveau fichier `lib/<fournisseur>.ts` + une entrée dans `docs/integrations.md`.

---

## 12. Le dossier `lib/` (garde-fous)

`lib/` est réservé à l'**infrastructure transverse**. Contenu autorisé :

| Fichier | Rôle |
|---|---|
| `env.ts` | Lecture et validation des variables d'environnement (section 14) |
| `db.ts` / `db/schema/` | Connexion Neon, schéma Drizzle |
| `auth.ts` | Session, contexte |
| `storage.ts` | Stockage de fichiers |
| `context.ts` | Types `UseCaseContext`, `AuthContext` |
| `errors.ts` | Classes d'erreurs métier partagées |
| `api/` | Utilitaires de transport REST (`with-api`, `respond`, mappers de sortie) |
| `logger.ts` | Journalisation structurée |

- **Interdit** : y mettre de la logique métier ou des fonctions « utilitaires » sans domaine. Si ça a un domaine, ça va dans un module.
- Les fichiers de `lib/` ne dépendent **jamais** de `modules/`.

---

## 13. Erreurs métier

- Les erreurs sont des **classes typées** définies dans `lib/errors.ts` : `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `RuleViolationError`, `RateLimitedError`.
- `application/` et `data/` **lèvent** ces erreurs (`data/` convertit notamment la violation d'unicité Postgres `23505` en `ConflictError`).
- La couche **transport** les **convertit** : REST via `withApi` (voir `rest.md`), GraphQL via le formateur d'erreurs (voir `graphql.md`).
- **Interdit** : lever `new Error("...")` brut pour un cas métier prévisible ; renvoyer un code HTTP depuis `application/` ; avaler une erreur silencieusement (`catch {}` vide).
- Les messages destinés à l'utilisateur sont **en français**, sans détail technique.

---

## 14. Variables d'environnement

- Lues **une seule fois**, dans `lib/env.ts`, **validées par Zod** au démarrage. Si une variable obligatoire manque ou est invalide, l'application **refuse de démarrer** avec un message clair.
- **Jamais** `process.env` en dehors de `lib/env.ts` (règle ESLint, section 16).
- Le reste du code importe l'objet validé : `import { env } from "@/lib/env";`.
- Séparation **serveur / client** :
  - Variables serveur (secrets, URL de base) : exportées par `env.server`, jamais importées par un composant client.
  - Variables publiques : préfixées `NEXT_PUBLIC_`, exportées par `env.client`.
- Toute nouvelle variable est ajoutée à **trois endroits** : `lib/env.ts` (schéma Zod), `.env.example` (valeur factice), `docs/environment.md` (description et environnements concernés : dev, production).
- **Jamais** de secret dans le code, dans un fichier committé, dans un log ou dans une réponse d'API.

---

## 15. Périmètre : ne pas construire le futur

- **Ne pas créer `apps/realtime`**, ni table, ni dépendance, ni dossier, ni type appartenant à une **version future** (messagerie, appels, chiffrement de bout en bout, vidéo, etc.). La référence est `docs/roadmap.md`.
- La V1 = les **10 fonctionnalités** du périmètre (compte, connexion, profil, compétences, projets, publication, consultation, recherche, modification).
- Besoin d'anticiper (ex. nommer proprement une table) ? Le faire **sans créer** l'élément. Noter l'idée dans `docs/roadmap.md`, pas dans le code.
- Une fonctionnalité hors périmètre demandée par l'utilisateur : proposer d'abord une entrée dans la roadmap ou une ADR, ne pas coder en douce.
- **Pas de code mort** : pas de fonction, fichier, export ou dépendance « au cas où ».

---

## 16. Garde-fous automatiques (à configurer)

Ces règles ne doivent pas reposer sur la seule discipline : elles sont **vérifiées par les outils** et **bloquent la CI**.

| Règle | Outil | Mécanisme |
|---|---|---|
| Sens de dépendance entre couches | `eslint-plugin-boundaries` ou `dependency-cruiser` | Règles `from`/`allow` par type de dossier |
| Import d'un module par son `index.ts` seulement | `eslint-plugin-boundaries` | Interdire `modules/*/(data\|application\|components)/**` depuis l'extérieur du module |
| Pas de dépendance circulaire | `import/no-cycle` ou `dependency-cruiser` | Erreur bloquante |
| `drizzle-orm` et `lib/db` seulement dans `data/` | `no-restricted-imports` | Restriction par dossier |
| `process.env` seulement dans `lib/env.ts` | `no-restricted-properties` | Interdit ailleurs |
| Pas de `any` | `@typescript-eslint/no-explicit-any` | `error` |
| Pas d'export par défaut (sauf Next.js) | `import/no-default-export` | Dérogation pour `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `*.config.*` |
| Code serveur non importable côté client | paquet `server-only` | `import "server-only"` en tête de `application/`, `data/`, `lib/db.ts`, `lib/env.ts` (partie serveur) |
| Types stricts | TypeScript | `"strict": true`, `noUncheckedIndexedAccess` |

Commandes : `npm run lint`, `npm run typecheck`, `npm test`, toutes exécutées en CI. Une violation de règle d'architecture **fait échouer la CI**.

---

## 17. Conventions de code

- **TypeScript strict** partout. Pas de `any`, pas de `as` pour contourner un type (sauf cas documenté en commentaire).
- **Nommage** : fichiers en `kebab-case` ; composants React en `PascalCase` (fichier `project-card.tsx`, export `ProjectCard`) ; fonctions en `camelCase` verbe d'abord ; constantes en `SCREAMING_SNAKE_CASE`.
- **Exports nommés** partout. Export par défaut **uniquement** pour les fichiers imposés par Next.js.
- **Imports** : alias `@/` pour `apps/web/src`, `@reseau/shared` pour le paquet partagé. Pas de chemins relatifs qui remontent de plus de deux niveaux (`../../..`).
- **Taille** : une fonction fait une chose ; un fichier de plus de ~200 lignes est un signal de découpage.
- **Commentaires** : expliquer le **pourquoi**, pas le quoi. Chaque cas d'usage commence par un commentaire d'une ligne décrivant la règle métier.
- **Langue** : code (noms, variables) en **anglais** ; messages utilisateur, commentaires explicatifs et documentation en **français**.
- **Pas de logique dans les composants** au-delà de l'affichage et de l'état d'interface. Un calcul métier dans un composant = erreur de couche.

---

## 18. Checklist « nouvelle fonctionnalité »

Dans cet ordre, du bas vers le haut :

- [ ] La fonctionnalité est dans le **périmètre V1** (sinon : roadmap/ADR d'abord).
- [ ] **Schémas Zod et types** ajoutés dans `packages/shared` (entrée, entité, erreurs).
- [ ] **Schéma Drizzle + migration** si une table change, avec les **index** nécessaires.
- [ ] **Repository** dans `data/` (fonctions Drizzle + mapping ligne → entité).
- [ ] **Cas d'usage** dans `application/` : règles métier, autorisation, transactions, erreurs typées. **Avec ses tests**.
- [ ] Export dans l'`index.ts` du module.
- [ ] **Transport** : route REST (`rest.md`) ou champ GraphQL (`graphql.md`) ou page/action serveur, minces.
- [ ] **Composants** : interface dans `components/`, qui consomme l'API sans importer le serveur.
- [ ] Variables d'environnement éventuelles ajoutées (`env.ts`, `.env.example`, `docs/environment.md`).
- [ ] `npm run lint && npm run typecheck && npm test` passent.
- [ ] Documentation et `CHANGELOG.md` mis à jour.

---

## 19. Interdits (liste rouge)

- ❌ SQL, Drizzle ou `lib/db` en dehors de `data/`.
- ❌ Règle métier ou autorisation en dehors de `application/`.
- ❌ Cas d'usage qui renvoie un code HTTP ou manipule `Request`/`Response`.
- ❌ Plusieurs cas d'usage dans un même fichier ; un cas d'usage qui n'a pas la signature `(ctx, input)`.
- ❌ `userId` ou `profileId` lu depuis le corps, l'URL ou le client au lieu de la session.
- ❌ Import profond dans un autre module (hors `index.ts`).
- ❌ Dépendance circulaire (fichiers ou modules).
- ❌ `components/` qui importe `application/`, `data/`, `lib/db` ou `lib/env`.
- ❌ `fetch` HTTP vers sa propre API depuis un composant serveur.
- ❌ Redéfinir un type ou un schéma déjà dans `packages/shared`.
- ❌ SDK d'auth ou de stockage importé en dehors de `lib/auth.ts` / `lib/storage.ts`.
- ❌ `process.env` en dehors de `lib/env.ts`.
- ❌ `any`, export par défaut hors fichiers Next.js, `catch {}` vide.
- ❌ Créer `apps/realtime` ou tout élément d'une version future.
- ❌ Code mort, dépendance « au cas où », fichier « utils » sans domaine.