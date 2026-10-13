# F17 — Administration plateforme

- **Version** : V1.5 · **Dépend de** : F14, F16 · **Agents** : backend, frontend, designer
- **Objectif** : console d'administration de la plateforme (espaces, contenus, journal).
- **User story** : En tant qu'admin plateforme, je veux créer des espaces, voir tout le
  contenu et lire le journal d'accès, afin de piloter le réseau.

## Contenu livré (partie plateforme)

| Écran | Rôle |
|---|---|
| `/admin` | tableau de bord : compteurs (espaces, contenus, accès récents) |
| `/admin/spaces` | liste, création, édition, archivage des espaces |
| `/admin/spaces/new` | formulaire de création |
| `/admin/spaces/[id]` | édition d'un espace (nom, description, visibilité) |
| `/admin/access-log` | journal d'accès (filtre par espace) |
| `/admin/profiles` | **tout voir** : tous les profils (y compris sans contenu) |
| `/admin/posts` | **tout voir** : tous les posts (auteur, date) |
| `/admin/projects` | **tout voir** : tous les projets (brouillons inclus) |
| `/admin/otp` | journal des **envois** OTP (adresse, type, date, résultat) — **jamais le code** |
| `/admin/comptes` | comptes (e-mail, date, statut) + suppression — **dépend de l'API admin Neon Auth** |

## Règles métier

1. Toute la console exige le rôle `admin` (garde serveur, `NOT_FOUND` pour un non-admin
   sur les pages, `FORBIDDEN` sur l'API).
2. **L'admin plateforme voit tout** : profils, posts et projets, **brouillons inclus**, sans
   filtre de visibilité. Lecture seule dans cette livraison (retrait = F20 modération).
3. Nommer un `space_admin` se fait depuis l'édition d'un espace (F15+).
4. Le journal d'accès est **en lecture seule** et **borné** (`ADMIN_LIST_LIMIT = 200`) :
   la console n'est pas publique, un curseur serait superflu.
5. Un espace archivé reste administrable (restauration possible plus tard).

## Extensions comptes (V1.5 — tranche sûre)

### Garde de vérification d'e-mail — ✅ livré

- Un utilisateur authentifié mais **non vérifié** (`session.user.emailVerified === false`)
  est redirigé vers `/verify-email` avant le rendu de toute page de l'app
  (`src/app/(app)/layout.tsx`, via `src/lib/auth-guard.ts`).
- Même garde **au niveau API** : `requireSession()` (`src/lib/auth.ts`) refuse
  (`FORBIDDEN`) une session non vérifiée, et le contexte GraphQL
  (`src/server/graphql/context.ts`) la traite comme anonyme. La garde UI seule ne suffisait
  pas (`security.md`).
- Neon Auth bloque déjà la connexion (`EMAIL_NOT_VERIFIED`) ; cette garde couvre le cas
  d'une **session créée à l'inscription** et non encore vérifiée (sinon `/` reste ouvert).
- Garde **fail-open** : si le champ `emailVerified` est absent de la session, on ne bloque
  pas (aucun risque d'enfermer les comptes existants). ⚠️ La forme réelle de `session.user`
  reste à **prouver** en environnement (voir `docs/TODO.md`).
- Aucune donnée nouvelle, aucune migration.

### Journal des envois OTP (option A — sans le code)

- But : tracer **qu'un code a été envoyé**, à quelle adresse, de quel type et quand.
- **Jamais le code.** Neon Auth (Managed Better Auth) génère et envoie l'OTP ; l'app ne
  le reçoit jamais. Aucune valeur de code n'est stockée ni journalisée (`security.md`,
  `authentification.md`).
- Table additive `auth_otp_audit` : `email`, `type` (`email-verification` |
  `forgot-password`), `outcome` (`sent` | `failed`), `error_code` (nullable), `created_at`.
- Écriture **best-effort** : un échec d'écriture ne doit jamais casser l'inscription, la
  connexion ou le renvoi de code.
- Page admin `/admin/otp` (onglet « OTP »), liste bornée (`OTP_EVENTS_LIMIT = 200`),
  lecture seule ; route `GET /api/admin/otp-events`.
- ⚠️ **Bloqué pour l'application uniquement** : la migration doit être appliquée sur la
  branche Neon dev (`npm run db:migrate`). Impossible tant que `node_modules` est vide
  (disque plein). Le SQL `0008_auth_otp_audit.sql` est écrit et additif ; à appliquer dès
  que les dépendances sont restaurées.

## API

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/api/admin/spaces` | liste (archivés inclus) |
| `POST` | `/api/admin/spaces` | créer |
| `PATCH` | `/api/admin/spaces/[id]` | modifier |
| `DELETE` | `/api/admin/spaces/[id]` | archiver |
| `GET` | `/api/admin/access-log` | journal (liste bornée) |
| `GET` | `/api/admin/otp-events` | journal des envois OTP (liste bornée, **jamais le code**) |
| `GET` | `/api/admin/profiles` | tous les profils (liste bornée) |
| `GET` | `/api/admin/posts` | tous les posts, brouillons inclus (liste bornée) |
| `GET` | `/api/admin/projects` | tous les projets, brouillons inclus (liste bornée) |

## Données

`spaces`, `space_access_log`, `memberships`, `profiles`, `posts`,
`projects`, `auth_otp_audit`.

> `auth_otp_audit` ne contient **aucun code OTP** (voir « Journal des envois OTP »).

## Sécurité et autorisation

- Garde unique : `requirePlatformAdmin(ctx)` ; aucune page/route admin sans elle.
- Le lien de navigation « Admin » n'apparaît que si l'utilisateur a le rôle `admin`
  (confort, **pas** la sécurité).
- Lecture seule pour les vues « tout voir » ; le retrait de contenu relève de F20, la
  suppression de compte ci-dessous.

## Comptes (dépendance externe)

La lecture des **informations de connexion** (e-mail, dates, sessions) et la **suppression
d'un compte** passent par l'API d'administration **Neon Auth** (`admin/list-users`,
`admin/remove-user`). Cette API exige une **clé serveur** Better Auth (ou une session admin
côté serveur). Tant qu'aucune clé serveur n'est fournie, ces deux fonctions restent
**bloquées** — voir `docs/TODO.md` (intervention utilisateur) et `docs/backlog.md`. La vue
`/admin/profiles` couvre en attendant tout ce que notre base contient.

## Critères d'acceptation

- [ ] Given un non-admin, When il ouvre `/admin`, Then `NOT_FOUND` (aucune fuite d'existence).
- [ ] Given un compte `role = "admin"`, When il crée un espace, Then il apparaît dans `/admin/spaces`.
- [ ] Given des accès journalisés, When il filtre par espace, Then seuls ces accès listent.
- [ ] Given un projet `draft`, When l'admin parcourt `/admin/projects`, Then il le voit.
- [ ] Given deux profils, When l'admin parcourt `/admin/profiles`, Then il voit les deux.
- [ ] Given un compte non vérifié, When il ouvre une page de l'app, Then il est redirigé
      vers `/verify-email` (garde `emailVerified === false`).
- [ ] Given un admin, When il ouvre `/admin/otp`, Then il voit les envois (adresse, type,
      date, résultat) et **aucun code** n'est présent dans la page ni dans l'API.
- [ ] Le lien « Admin » est absent du sidebar pour un non-admin.

## Tests attendus

- Unitaires : garde de vérification, garde admin, use cases (repos mockés), validation,
  mappers (jamais de `userId`) ; l'audit OTP ne stocke jamais de code.

## Hors périmètre (reste F17)

Console d'admin **d'espace** (approuver/refuser/retirer des membres, configurer les
méthodes d'accès, modérer) — dépend de F15 (rejoindre un espace) et F20 (signalement).
