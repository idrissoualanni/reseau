---
description: Route handlers REST (Next.js App Router) — conventions, validation, erreurs, sécurité, tests
paths: ["apps/web/src/app/api/**"]
---
# REST — Règles des route handlers

> Cette règle s'applique à tout fichier sous `apps/web/src/app/api/**`.
> Périmètre : REST gère **tout sauf les projets et les posts** (ceux-ci sont en GraphQL, voir `.claude/rules/graphql.md`).
> Lire aussi : `.claude/rules/architecture.md` (couches), `.claude/rules/security.md`, `docs/api/rest.md` (catalogue à jour).

---

## 1. Principes

1. **Un handler est un adaptateur HTTP, pas de la logique métier.** Il traduit une requête HTTP en appel de cas d'usage, puis un résultat en réponse HTTP.
2. **Un handler appelle exactement UN cas d'usage** du dossier `application/`. Jamais deux. Si on a besoin de deux, on crée un nouveau cas d'usage qui les orchestre.
3. **Le handler n'accède jamais à la base** (pas d'import Drizzle, pas de `db.select(...)`). Seuls les cas d'usage et les repositories parlent à Neon.
4. **Rien d'implicite** : toute entrée est validée, toute sortie est mappée, toute erreur est formatée.
5. **Sécurisé par défaut** : une route est privée tant qu'on n'a pas décidé explicitement qu'elle est publique (voir section 6).

---

## 2. Anatomie d'un handler (les 4 étapes, dans cet ordre)

Chaque handler suit exactement ce squelette. Pas d'étape en plus, pas d'étape en moins.

```ts
// apps/web/src/app/api/me/profile/route.ts
import { NextRequest } from "next/server";
import { withApi } from "@/lib/api/with-api";            // wrapper : erreurs, logs, headers
import { requireSession } from "@/lib/auth/require-session";
import { updateProfileInput } from "@/lib/api/schemas/profile";
import { updateProfile } from "@/application/profile/update-profile";
import { toOwnProfileDto } from "@/lib/api/mappers/profile";
import { ok } from "@/lib/api/respond";

export const PATCH = withApi(async (req: NextRequest) => {
  // 1. Lire la session (401 si absente)
  const session = await requireSession(req);

  // 2. Valider l'entrée avec Zod (400 si invalide)
  const input = updateProfileInput.parse(await req.json());

  // 3. Appeler UN SEUL cas d'usage
  const profile = await updateProfile({ userId: session.userId, ...input });

  // 4. Formater la réponse (mapping de sortie)
  return ok(toOwnProfileDto(profile));
});
```

Règles de lecture :
- `withApi` attrape toute exception, la convertit au format d'erreur unique (section 8) et ajoute les en-têtes communs. **Aucun `try/catch` dans les handlers** sauf cas documenté.
- `requireSession` lève une `UnauthorizedError` (→ 401). Pour une route publique, on utilise `getSessionOrNull` et on le justifie en commentaire.
- Le `userId` vient **toujours de la session**, **jamais** du corps, de l'URL ou d'un paramètre pour les routes `/api/me/**`.

---

## 3. Arborescence et nommage

```
apps/web/src/app/api/
├── health/route.ts                      GET
├── me/
│   ├── profile/route.ts                 GET, POST, PATCH
│   └── skills/
│       ├── route.ts                     GET, POST
│       └── [skillId]/route.ts           DELETE
├── skills/route.ts                      GET (référentiel + recherche)
├── profiles/[username]/route.ts         GET
├── search/students/route.ts             GET
└── uploads/presign/route.ts             POST

apps/web/src/lib/api/
├── with-api.ts          wrapper commun (erreurs, logs, headers, rate limit)
├── respond.ts           ok(), created(), noContent(), paginated()
├── errors.ts            classes d'erreurs + codes
├── schemas/             schémas Zod d'entrée (un fichier par ressource)
└── mappers/             fonctions de mapping de sortie (un fichier par ressource)
```

- Un dossier = une ressource. Le fichier s'appelle **toujours** `route.ts`.
- Les schémas Zod sont dans `lib/api/schemas/`, **jamais inline** dans le handler (réutilisables et testables).
- Les noms de ressources sont au **pluriel** (`/skills`) sauf les ressources singleton de l'utilisateur connecté (`/me/profile`).
- URLs en **kebab-case** minuscules ; champs JSON en **camelCase**.

---

## 4. Catalogue des ressources (V1)

| Méthode | Route | Auth | Fonctionnalité V1 | Cas d'usage appelé | Succès |
|---|---|---|---|---|---|
| GET | `/api/health` | publique | — (supervision Render) | `checkHealth` | 200 |
| POST | `/api/me/profile` | session | Créer son profil | `createProfile` | 201 |
| GET | `/api/me/profile` | session | Modifier son profil (lecture) | `getOwnProfile` | 200 |
| PATCH | `/api/me/profile` | session | Modifier son profil | `updateProfile` | 200 |
| GET | `/api/me/skills` | session | Ajouter ses compétences (liste) | `listOwnSkills` | 200 |
| POST | `/api/me/skills` | session | Ajouter ses compétences | `addOwnSkill` | 201 |
| DELETE | `/api/me/skills/{skillId}` | session | Retirer une compétence | `removeOwnSkill` | 204 |
| GET | `/api/skills?q=` | session | Référentiel / autocomplétion | `searchSkills` | 200 |
| GET | `/api/profiles/{username}` | session | Consulter le profil d'un étudiant | `getPublicProfile` | 200 |
| GET | `/api/search/students?skill=` | session | Rechercher un étudiant par compétence | `searchStudents` | 200 |
| POST | `/api/uploads/presign` | session | Image d'un projet / photo de profil | `createUploadUrl` | 201 |

Notes :
- **Inscription et connexion** sont gérées par **Neon Auth** (routes d'authentification fournies). On n'écrit **pas** de route REST maison pour `signup` / `login` / `logout`.
- **Projets et posts** (créer, publier, consulter) passent par **GraphQL** (`/api/graphql`). Ne pas les dupliquer en REST.
- Toute nouvelle route doit être ajoutée à ce tableau **et** à `docs/api/rest.md` dans le même commit.

---

## 5. Verbes HTTP et codes de statut

| Verbe | Usage | Corps requête | Succès |
|---|---|---|---|
| GET | Lecture, sans effet de bord | aucun | 200 |
| POST | Création d'une ressource (ou action non idempotente) | JSON | 201 (+ `Location`) ou 200 |
| PATCH | Modification **partielle** (seuls les champs envoyés changent) | JSON | 200 (ressource à jour) |
| DELETE | Suppression | aucun | 204 (sans corps) |

**Pas de PUT en V1** (on ne remplace jamais une ressource entière).

| Code | Quand | `error.code` |
|---|---|---|
| 200 | Lecture ou modification réussie | — |
| 201 | Création réussie (en-tête `Location` vers la ressource) | — |
| 204 | Suppression réussie, aucun corps | — |
| 400 | JSON illisible, paramètre manquant ou mal formé, échec Zod | `VALIDATION` |
| 401 | Pas de session valide | `UNAUTHENTICATED` |
| 403 | Session valide mais action interdite (pas propriétaire, e-mail non vérifié) | `FORBIDDEN` / `EMAIL_NOT_VERIFIED` |
| 404 | Ressource inexistante **ou à ne pas révéler** | `NOT_FOUND` |
| 409 | Conflit d'état : doublon, `username` déjà pris, profil déjà créé | `CONFLICT` |
| 422 | Entrée valide mais règle métier violée (ex. trop de compétences) | `RULE_VIOLATION` |
| 429 | Trop de requêtes | `RATE_LIMITED` (+ `Retry-After`) |
| 500 | Erreur inattendue (message générique, détail dans les logs) | `INTERNAL` |

Règle 400 vs 422 : **400** = la forme est mauvaise (Zod refuse). **422** = la forme est bonne mais le métier refuse.

---

## 6. Authentification et autorisation

**Authentification (qui es-tu ?)**
- Session fournie par **Neon Auth**. Récupérée par `requireSession(req)` dans `lib/auth/`.
- Aucune lecture manuelle de cookie ou de JWT dans un handler.
- Routes **publiques** : uniquement `/api/health`. Tout le reste exige une session, y compris la consultation d'un profil.

**Autorisation (as-tu le droit ?)**
- Routes `/api/me/**` : la ressource appartient **par construction** à l'utilisateur de la session. Le `userId` n'est jamais lu depuis l'entrée.
- Routes `/api/profiles/{username}` : le cas d'usage applique les règles de visibilité (profil public vs champs privés). Le handler ne décide rien.
- **Vérification de propriété** (ex. supprimer `skillId`) : faite **dans le cas d'usage** (la requête filtre sur `user_id`). Si la ressource appartient à quelqu'un d'autre → **404**, pas 403 (on ne révèle pas son existence).
- Actions d'écriture : exigent un **e-mail vérifié** (`EMAIL_NOT_VERIFIED`, 403). La lecture reste possible.

**Protection CSRF / origine**
- Les méthodes non sûres (POST, PATCH, DELETE) vérifient l'en-tête `Origin` contre la liste d'origines autorisées (`APP_ORIGINS`). Origine inconnue → 403.
- CORS : **fermé par défaut**. Aucune origine tierce autorisée en V1.

---

## 7. Validation des entrées (Zod)

- **Tout** ce qui vient du client est validé : corps JSON, query string, paramètres de chemin, en-têtes utiles.
- Schémas d'objet en **`.strict()`** : un champ inconnu est refusé (400). Cela protège `user_id`, `username` (immuable après création), `role`, `createdAt`, etc.
- Les schémas d'entrée (`createProfileInput`, `updateProfileInput`…) sont **distincts** des schémas de sortie. Ne jamais réutiliser un schéma de table Drizzle comme schéma d'entrée.
- `PATCH` : le schéma est `.partial()` du schéma de création **moins les champs immuables**, avec au moins un champ (`.refine(o => Object.keys(o).length > 0)`).
- Chaînes : toujours `trim()`, longueur min/max explicite, pas de HTML accepté (le texte est stocké brut, échappé à l'affichage par React).
- Paramètres de requête : convertis avec `z.coerce` (ex. `limit`), avec **valeur par défaut** et **plafond**.
- Valeurs par défaut indicatives (à ajuster dans `lib/api/schemas/`, source de vérité unique) :

| Champ | Contrainte |
|---|---|
| `username` | `^[a-z0-9_]{3,30}$`, unique, immuable |
| `displayName` | 1–80 caractères |
| `bio` | 0–500 caractères |
| `skill.name` (libre) | 2–50 caractères |
| `limit` | entier 1–50, défaut 20 |
| `cursor` | chaîne opaque ≤ 200 caractères |
| compétences par profil | max 30 (sinon 422 `RULE_VIOLATION`) |

- Un échec Zod est converti par `withApi` en erreur `VALIDATION` avec `fields` (voir section 8). Le handler ne formate jamais l'erreur Zod lui-même.

---

## 8. Format d'erreur unique

**Toute** réponse d'erreur, sans exception, a cette forme :

```json
{
  "error": {
    "code": "VALIDATION",
    "message": "Certains champs sont invalides.",
    "fields": { "bio": "Trop long (500 caractères max)" }
  }
}
```

- `code` : constante en MAJUSCULES stable (le front s'appuie dessus, **jamais** sur `message`).
- `message` : phrase lisible, **en français**, sans détail technique.
- `fields` : présent **uniquement** pour `VALIDATION` (et `RULE_VIOLATION` si un champ précis est en cause). Clé = chemin du champ (`bio`, `skills.0.name`), valeur = message court.
- **Jamais** de stack trace, de requête SQL, de nom de table, de chemin de fichier ni de message d'exception brut dans la réponse.
- Les erreurs 500 renvoient `{ "error": { "code": "INTERNAL", "message": "Une erreur est survenue." } }` plus un `requestId` dans l'en-tête `X-Request-Id` ; le détail est dans les logs.
- Les erreurs sont des **classes typées** dans `lib/api/errors.ts` (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `RuleViolationError`, `RateLimitedError`). Les cas d'usage les lèvent ; `withApi` les convertit. Un cas d'usage ne connaît pas HTTP et ne renvoie pas de code de statut.

---

## 9. Pagination par curseur

Toute route qui renvoie une liste potentiellement longue est paginée **par curseur** (jamais par `page`/`offset`).

Requête : `GET /api/search/students?skill=react&limit=20&cursor=eyJ...`

Réponse :
```json
{
  "items": [ { "username": "awa-d", "displayName": "Awa Diop" } ],
  "nextCursor": "eyJpZCI6IjQyIn0"
}
```

- `limit` : défaut 20, **maximum 50** (au-delà : plafonné ou 400, mais cohérent dans tout le projet).
- `nextCursor` : `null` quand il n'y a plus de résultats.
- Le curseur est une **chaîne opaque** (base64url d'un JSON `{ sortKey, id }`). Le client ne le fabrique ni ne l'interprète.
- Tri **déterministe et stable** : toujours un second critère unique (`id`) pour éviter doublons et trous.
- Technique : on demande `limit + 1` lignes ; s'il y en a `limit + 1`, on retire la dernière et on construit `nextCursor`.
- Curseur invalide ou altéré → 400 `VALIDATION`.
- Les listes courtes et bornées (`/api/me/skills`, max 30) peuvent renvoyer `{ items }` sans curseur, mais gardent l'enveloppe `{ items }`.

---

## 10. Mapping de sortie (aucune fuite de données)

- **On ne renvoie jamais une ligne de base de données telle quelle.** Chaque ressource a une fonction de mapping dans `lib/api/mappers/`.
- Données **jamais exposées** vers un autre utilisateur : e-mail, `user_id`, identifiants internes d'authentification, dates techniques non utiles, champs de modération.
- Deux DTO distincts par ressource quand nécessaire :
  - `toOwnProfileDto` : vue du propriétaire (peut inclure l'e-mail et l'état de vérification).
  - `toPublicProfileDto` : vue d'un tiers (pseudo, nom affiché, bio, compétences, avatar).
- Les identifiants exposés sont des **identifiants publics** (`username`, ids opaques), pas des clés primaires internes si elles sont devinables.
- Les mappers sont des **fonctions pures**, testées (section 15) : on y vérifie explicitement l'**absence** des champs sensibles.
- Dates en **ISO 8601 UTC** (`2026-10-08T12:00:00.000Z`).

---

## 11. Uploads (`/api/uploads/presign`)

Flux : le client demande une URL pré-signée, puis envoie le fichier **directement** au stockage (le serveur Render ne transporte pas les octets).

1. `POST /api/uploads/presign` avec `{ "purpose": "project-image" | "avatar", "contentType": "image/webp", "sizeBytes": 412345 }`.
2. Le serveur vérifie : session, e-mail vérifié, `purpose` connu, `contentType` dans la liste blanche (`image/jpeg`, `image/png`, `image/webp`), taille ≤ plafond (ex. 5 Mo), quota de l'utilisateur.
3. Réponse 201 : `{ "uploadUrl": "…", "publicUrl": "…", "expiresAt": "…" }`.
4. Le client envoie le fichier à `uploadUrl`, puis référence `publicUrl` (ex. dans la mutation GraphQL de création de projet).

Règles :
- La **clé d'objet** est générée côté serveur (`{purpose}/{userId}/{uuid}.{ext}`) ; le client ne choisit **jamais** le chemin ni le nom.
- URL pré-signée à **courte durée** (≤ 5 minutes), à usage unique.
- Jamais de SVG ni de fichier exécutable.
- Un fichier non référencé après 24 h est candidat au nettoyage (tâche planifiée).

---

## 12. Limitation de débit (rate limiting)

| Groupe de routes | Limite indicative | Clé |
|---|---|---|
| Lecture (`GET`) | 120 / minute | `userId` |
| Écriture (`POST`/`PATCH`/`DELETE`) | 30 / minute | `userId` |
| `/api/search/students` | 30 / minute | `userId` |
| `/api/uploads/presign` | 10 / minute | `userId` |

- Dépassement → 429 `RATE_LIMITED` avec en-tête `Retry-After` (secondes).
- Implémentation centralisée dans `withApi` (une seule fois, pas route par route).
- **Cloudflare** reste la première ligne de défense (WAF, protection DDoS, règles de débit par IP) ; la limite applicative protège par utilisateur. Les deux se complètent.
- Récupération de l'IP réelle via l'en-tête fourni par Cloudflare (`CF-Connecting-IP`), uniquement si la requête provient bien de Cloudflare.

---

## 13. Cache

- **Défaut : `Cache-Control: no-store`** sur toutes les routes authentifiées (posé par `withApi`). Aucune donnée privée ne doit pouvoir être stockée par un cache partagé (navigateur, proxy, CDN).
- Routes `GET` dynamiques de Next.js : `export const dynamic = "force-dynamic"` pour empêcher toute mise en cache implicite.
- Exception unique documentée : `GET /api/skills` (référentiel peu changeant) peut utiliser `private, max-age=300`. Toute autre exception exige un commentaire justifiant pourquoi aucune donnée privée n'est concernée.
- **Cloudflare** : ne jamais créer de règle de cache sur `/api/*`.

---

## 14. Concurrence, idempotence et cohérence

- `DELETE` est **idempotent** : supprimer deux fois la même ressource renvoie 204 la première fois, 404 ou 204 ensuite (choix unique et cohérent dans tout le projet : **204**).
- `POST /api/me/profile` : si le profil existe déjà → 409 `CONFLICT` (contrainte `UNIQUE(user_id)` en base comme **filet de sécurité**).
- `POST /api/me/skills` : ajouter une compétence déjà présente → 409 (contrainte `UNIQUE(user_id, skill_id)`).
- Unicité du `username` : garantie par **contrainte unique en base**, pas seulement par une vérification préalable (condition de course). Violation d'unicité Postgres (`23505`) → convertie en `ConflictError`.
- Opérations multi-tables dans une **transaction**, ouverte et fermée **dans le cas d'usage**.

---

## 15. Tests (Vitest)

Fichiers de test à côté du code : `route.test.ts`, `mappers/*.test.ts`, `schemas/*.test.ts`.

À tester pour **chaque route** :
1. **401** sans session.
2. **400** avec corps invalide, **champ inconnu** (`.strict()`), type incorrect.
3. **Cas nominal** : bon code de statut, forme exacte de la réponse.
4. **403/404** : tentative d'accès à la ressource d'un autre utilisateur.
5. **409/422** pour chaque règle d'unicité ou métier de la route.
6. **Format d'erreur** : la réponse correspond exactement au schéma d'erreur unique, sans stack trace.
7. **Pagination** (listes) : `limit` plafonné, `nextCursor` correct, curseur altéré refusé.

À tester pour **chaque mapper** : les champs sensibles (`email`, `userId`) sont **absents** du DTO public (test d'égalité stricte sur les clés).

Règles :
- Le cas d'usage est **simulé (mock)** dans les tests de handler : on teste l'adaptateur HTTP, pas la logique métier.
- La logique métier se teste dans les tests du cas d'usage (voir `.claude/rules/testing.md`).
- Commandes : `npm test` (exécution), `npm run test:ui` (Vitest UI). Aucune route fusionnée sans tests verts.

---

## 16. Observabilité et journalisation

- `withApi` génère un `requestId` (UUID) par requête, le met dans `X-Request-Id` et dans tous les logs.
- Log structuré (JSON) par requête : `requestId`, méthode, route (pattern, ex. `/api/profiles/[username]`), statut, durée en ms, `userId` (si connecté).
- **Interdit dans les logs** : corps de requête complet, e-mails, tokens, cookies, URLs pré-signées.
- Les erreurs 5xx loguent la stack trace **côté serveur uniquement**.

---

## 17. Santé (`/api/health`)

- `GET /api/health` : publique, rapide, sans authentification, utilisée par Render comme **health check**.
- Réponse 200 : `{ "status": "ok", "version": "<commit court>" }`.
- Vérifie que le processus répond et que la base répond (requête `SELECT 1` avec timeout court). Base indisponible → 503 `{ "status": "degraded" }`.
- Ne renvoie **aucun** détail d'infrastructure (hôte, version de base, variables d'environnement).

---

## 18. Documentation et évolution de l'API

- Le catalogue vit dans `docs/api/rest.md` (tableau de la section 4 + exemples de requête/réponse). Le mettre à jour **dans le même commit** que la route.
- Pas de préfixe de version (`/v1`) en V1 : l'application web est le seul client. Si un client tiers apparaît, on introduira `/api/v2` sans casser l'existant.
- **Changements rétrocompatibles** (ajout d'un champ de réponse, d'un paramètre optionnel) : autorisés.
- **Changements cassants** (retrait ou renommage d'un champ, nouveau champ obligatoire) : exigent une **ADR** dans `docs/adr/` et une entrée dans `CHANGELOG.md`.
- Ne jamais introduire de route REST pour un domaine GraphQL (projets, posts) sans ADR.

---

## 19. Checklist « nouvelle route » (à suivre dans l'ordre)

- [ ] La route est ajoutée au tableau de la section 4 et à `docs/api/rest.md`.
- [ ] Le cas d'usage existe dans `application/` (sinon le créer d'abord, avec ses tests).
- [ ] Le schéma Zod d'entrée est en `.strict()` dans `lib/api/schemas/`.
- [ ] Le mapper de sortie existe dans `lib/api/mappers/`, avec test d'absence des champs sensibles.
- [ ] Le handler suit les 4 étapes (session → Zod → un cas d'usage → réponse), enveloppé dans `withApi`.
- [ ] Authentification et propriété de la ressource vérifiées (404 si pas à soi).
- [ ] Codes de statut conformes à la section 5.
- [ ] Liste ? Pagination par curseur, `limit` ≤ 50.
- [ ] Tests Vitest : 401, 400, nominal, 403/404, 409/422, format d'erreur.
- [ ] `Cache-Control: no-store` par défaut (ou exception justifiée).
- [ ] `npm run lint`, `npm run typecheck`, `npm test` passent.
- [ ] Entrée ajoutée à `CHANGELOG.md`.

---

## 20. Interdits (liste rouge)

- ❌ Logique métier ou accès base de données dans un `route.ts`.
- ❌ Appeler deux cas d'usage dans un même handler.
- ❌ Lire `userId` depuis le corps, l'URL ou la query pour une route `/api/me/**`.
- ❌ Renvoyer une ligne de base de données brute (toujours un mapper).
- ❌ Schéma Zod sans `.strict()` sur une entrée d'objet.
- ❌ Stack trace, SQL ou message d'exception brut dans une réponse.
- ❌ Pagination par `offset` / `page`.
- ❌ Route publique en dehors de `/api/health` sans ADR.
- ❌ Écrire un `signup` / `login` maison (Neon Auth s'en charge).
- ❌ Dupliquer en REST une fonctionnalité de projets/posts déjà en GraphQL.
- ❌ Mettre en cache (navigateur ou Cloudflare) une route authentifiée.
- ❌ Logger des e-mails, tokens, cookies ou URLs pré-signées.
- ❌ Utiliser `any` ou `as` pour contourner la validation.