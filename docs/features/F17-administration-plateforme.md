# F17 — Administration plateforme

- **Version** : V1.5 · **Dépend de** : F14, F16 · **Agents** : backend, frontend, designer
- **Objectif** : console d'administration de la plateforme (espaces, admins, journal).
- **User story** : En tant qu'admin plateforme, je veux créer des espaces, nommer des admins
  et lire le journal d'accès, afin de piloter le réseau.

## Contenu livré (partie plateforme)

| Écran | Rôle |
|---|---|
| `/admin` | tableau de bord : compteurs (espaces, admins, contenus, accès récents) |
| `/admin/spaces` | liste, création, édition, archivage des espaces |
| `/admin/spaces/new` | formulaire de création |
| `/admin/spaces/[id]` | édition d'un espace (nom, description, visibilité) |
| `/admin/admins` | nommer / retirer des admins plateforme |
| `/admin/access-log` | journal d'accès (filtre par espace) |
| `/admin/profiles` | **tout voir** : tous les profils (y compris sans contenu) |
| `/admin/posts` | **tout voir** : tous les posts (auteur, date) |
| `/admin/projects` | **tout voir** : tous les projets (brouillons inclus) |
| `/admin/comptes` | comptes (e-mail, date, statut) + suppression — **dépend de l'API admin Neon Auth** |

## Règles métier

1. Toute la console exige `platform_admin` (garde serveur, `NOT_FOUND` pour un non-admin
   sur les pages, `FORBIDDEN` sur l'API).
2. **L'admin plateforme voit tout** : profils, posts et projets, **brouillons inclus**, sans
   filtre de visibilité. Lecture seule dans cette livraison (retrait = F20 modération).
3. Nommer un `space_admin` se fait depuis l'édition d'un espace (F15+).
4. Le journal d'accès est **en lecture seule** et **borné** (`ADMIN_LIST_LIMIT = 200`) :
   la console n'est pas publique, un curseur serait superflu.
5. Un espace archivé reste administrable (restauration possible plus tard).

## API

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/api/admin/spaces` | liste (archivés inclus) |
| `POST` | `/api/admin/spaces` | créer |
| `PATCH` | `/api/admin/spaces/[id]` | modifier |
| `DELETE` | `/api/admin/spaces/[id]` | archiver |
| `GET` | `/api/admin/admins` | liste des platform admins |
| `POST` | `/api/admin/admins` | nommer |
| `DELETE` | `/api/admin/admins/[profileId]` | retirer |
| `GET` | `/api/admin/access-log` | journal (liste bornée) |
| `GET` | `/api/admin/profiles` | tous les profils (liste bornée) |
| `GET` | `/api/admin/posts` | tous les posts, brouillons inclus (liste bornée) |
| `GET` | `/api/admin/projects` | tous les projets, brouillons inclus (liste bornée) |

## Données

`spaces`, `platform_admins`, `space_access_log`, `memberships`, `profiles`, `posts`,
`projects`.

## Sécurité et autorisation

- Garde unique : `requirePlatformAdmin(ctx)` ; aucune page/route admin sans elle.
- Le lien de navigation « Admin » n'apparaît que si l'utilisateur est `platform_admin`
  (confort, **pas** la sécurité).
- Lecture seule pour les vues « tout voir » ; le retrait de contenu relève de F20, la
  suppression de compte ci-dessous.

## Comptes (dépendance externe)

La lecture des **informations de connexion** (e-mail, dates, sessions) et la **suppression
d'un compte** passent par l'API d'administration **Neon Auth** (`admin/list-users`,
`admin/remove-user`). Or cette API autorise selon le rôle `admin` **de Neon Auth**, distinct
du `platform_admin` applicatif. Tant qu'aucun compte ne porte ce rôle (ou qu'aucune clé
serveur n'est fournie), ces deux fonctions restent **bloquées** — voir `docs/TODO.md`
(intervention utilisateur) et `docs/backlog.md`. La vue `/admin/profiles` couvre en attendant
tout ce que notre base contient.

## Critères d'acceptation

- [ ] Given un non-admin, When il ouvre `/admin`, Then `NOT_FOUND` (aucune fuite d'existence).
- [ ] Given un platform_admin, When il crée un espace, Then il apparaît dans `/admin/spaces`.
- [ ] Given un platform_admin, When il retire un admin (≠ dernier), Then il disparaît.
- [ ] Given des accès journalisés, When il filtre par espace, Then seuls ces accès listent.
- [ ] Given un projet `draft`, When l'admin parcourt `/admin/projects`, Then il le voit.
- [ ] Given deux profils, When l'admin parcourt `/admin/profiles`, Then il voit les deux.
- [ ] Le lien « Admin » est absent du sidebar pour un non-admin.

## Tests attendus

- Unitaires : garde, use cases (repos mockés), validation, mappers (jamais de `userId`).

## Hors périmètre (reste F17)

Console d'admin **d'espace** (approuver/refuser/retirer des membres, configurer les
méthodes d'accès, modérer) — dépend de F15 (rejoindre un espace) et F20 (signalement).
