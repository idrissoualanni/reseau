# F16 — Rôles et appartenances

- **Version** : V1.5 · **Dépend de** : F14 · **Agents** : backend, securite, frontend
- **Objectif** : porter des rôles sur chaque appartenance, sans branche de code dispersée.
- **User story** : En tant qu'admin plateforme, je veux nommer des admins, afin de déléguer
  la gestion des espaces.

## Règles métier

1. Rôles d'espace stockés en **données** : `memberships.role` ∈ {`member`, `space_admin`}.
2. Rôle plateforme : table `platform_admins` (`profile_id`).
3. Un profil a **au plus une** appartenance par espace (`UNIQUE(space_id, profile_id)`).
4. Un compte peut appartenir à plusieurs espaces avec des rôles différents.
5. Autorisation **côté serveur** à chaque cas d'usage : `requirePlatformAdmin`,
   `requireSpaceAdmin`. Jamais seulement dans l'UI.
6. Moindre privilège : un `space_admin` n'administre que **son** espace.
7. Amorçage : `PLATFORM_ADMIN_EMAILS` (liste d'e-mails) accorde le rôle `platform_admin`
   au profil correspondant lors du contrôle d'accès (idempotent). Aucun secret en base.
8. Dernier admin plateforme : impossible de retirer le dernier `platform_admin`.

## Écrans / routes

`/admin/admins` (nommer/retirer des admins plateforme) — voir UX `admin-plateforme.md`.

## API

| Méthode | Route | Entrée | Sortie |
|---|---|---|---|
| `GET` | `/api/admin/admins` | — | liste des platform admins |
| `POST` | `/api/admin/admins` | `{ profileId }` | admin nommé |
| `DELETE` | `/api/admin/admins/[profileId]` | — | admin retiré |

## Données

`memberships` (`role`, `verification_level`, `verified_via`), `platform_admins`.

## Validation (Zod)

`grantPlatformAdminSchema` (`{ profileId: uuid }`), `setMembershipRoleSchema`.

## Erreurs

| Cas | Code | Message |
|---|---|---|
| non admin plateforme | `FORBIDDEN` | « Accès refusé. » |
| retrait du dernier admin | `RULE_VIOLATION` | « Il doit rester au moins un admin. » |
| profil inexistant | `NOT_FOUND` | « Profil introuvable. » |

## Sécurité et autorisation

- Seul un `platform_admin` nomme/retire un `platform_admin` et pose un `space_admin`.
- Un `space_admin` ne peut agir que sur son espace (vérifié en base).
- Aucune élévation possible depuis un rôle inférieur.

## Critères d'acceptation

- [ ] Given un platform_admin connecté, When il nomme un profil, Then il devient admin.
- [ ] Given un non-admin, When il appelle `POST /api/admin/admins`, Then `FORBIDDEN`.
- [ ] Given un seul platform_admin, When il se retire, Then `RULE_VIOLATION`.
- [ ] Given `PLATFORM_ADMIN_EMAILS`, When le profil correspondant agit, Then il est admin.

## Tests attendus

- Unitaires : garde d'autorisation (`admin.test.ts`, repos mockés), validation.

## Hors périmètre

Rôles `recruiter` / `entrepreneur` / `mentor` (V3), permissions par champ.
