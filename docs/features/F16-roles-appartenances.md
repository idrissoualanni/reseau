# F16 — Rôles et appartenances

- **Version** : V1.5 · **Dépend de** : F14 · **Agents** : backend, securite, frontend
- **Objectif** : porter des rôles sur chaque appartenance, sans branche de code dispersée.
- **User story** : En tant qu'admin plateforme, je veux déléguer la gestion des espaces
  à des rôles, afin de répartir les responsabilités.

## Règles métier

1. Rôle plateforme : champ `role` de **Neon Auth** (`"user"` / `"admin"`). Source unique,
   gérée dans la **console Neon Auth**. Aucune table applicative (`platform_admins` supprimée).
2. Rôle d'espace : colonne `memberships.role` (`member`, `space_admin`).
3. L'autorisation est vérifiée **côté serveur** (`requirePlatformAdmin`) ; la valeur vient
   de la session serveur, jamais de la requête.
4. `role` peut être une chaîne ou un tableau → normalisé par `normalizeRoles`.
5. Aucune élévation possible depuis un rôle inférieur.

## Écrans / routes

Pas d'écran applicatif : les rôles se gèrent dans la console Neon Auth. `/admin/*` est
réservé au rôle `admin` (voir UX `admin-plateforme.md`).

## API

Aucune route dédiée (les routes `/admin/admins` ont été retirées).

## Données

`memberships` (`role`, `verification_level`, `verified_via`). Le rôle plateforme vit dans
`neon_auth."user".role`, hors schéma applicatif.

## Validation (Zod)

`setMembershipRoleSchema`.

## Erreurs

| Cas | Code | Message |
|---|---|---|
| rôle plateforme absent | `FORBIDDEN` | « Accès refusé. » |

## Sécurité et autorisation

- Seul un compte dont `role` contient `"admin"` accède à `/admin` et à ses cas d'usage.
- Un admin d'espace ne peut agir que sur son espace (vérifié en base).
- Aucune élévation possible depuis un rôle inférieur.

## Critères d'acceptation

- [x] Given un compte Neon Auth `role = "admin"`, When il ouvre `/admin`, Then il y accède.
- [x] Given un compte `role = "user"`, When il ouvre `/admin`, Then 404 (pas de fuite).
- [x] Given `role` rendu en tableau, When la session est lue, Then le rôle admin est détecté.

## Tests attendus

- Unitaires : garde d'autorisation (`admin.test.ts`, repos mockés), normalisation des rôles.

## Hors périmètre

Rôles `recruiter` / `entrepreneur` / `mentor` (V3), permissions par champ.
