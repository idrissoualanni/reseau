# F15 — Rejoindre un espace (méthodes d'accès)

- **Version** : V1.5 · **Dépend de** : F14 · **Agents** : backend, frontend, securite
- **Objectif** : rejoindre un espace (ou demander l'accès) par la méthode qu'il propose.
- **User story** : En tant qu'utilisateur, je veux rejoindre un espace avec la méthode
  proposée, afin de devenir membre.

## Contenu

Méthodes `open`, `invite_code`, `invite_link`, `manual_approval` (ADR 0006). La preuve est
portée par l'**appartenance** (`memberships.verification_level`, `memberships.verified_via`),
jamais par le compte. Ajouter une méthode = 1 implémentation `AccessMethod` + 1 ligne de
config (`space_access_methods`). **Tout accès est journalisé** (`space_access_log`).

## Règles métier

1. L'utilisateur choisit parmi les méthodes **actives** de l'espace concerné.
2. `open` → adhésion immédiate, `verification_level='unverified'`, `verified_via='open'`,
   journal `join`.
3. `invite_code` → code valide (comparé au **hash** en config) → `verified`,
   `verified_via='invite_code'`, journal `join`.
4. `invite_link` → jeton valide et non expiré → `verified`, `verified_via='invite_link'`,
   journal `join`.
5. `manual_approval` → demande **en attente** (`unverified`, `verified_via='manual_approval'`),
   journal `request` ; l'approbation (F17) passe à `verified` + journal `approve`.
6. Un compte n'a **qu'une appartenance par espace** (contrainte `memberships_space_profile_uq`) :
   - membre actif → `409` « Tu es déjà membre de cet espace. » ;
   - demande déjà en attente → `409` « Ta demande est déjà en attente. ».
7. Espace privé ou archivé → `404` (aucune fuite d'existence).
8. La réponse décrit l'état obtenu : `{ status: 'joined' | 'pending', membership }`.

## API

| Méthode | Route | Rôle |
|---|---|---|
| `POST` | `/api/spaces/[slug]/join` | rejoindre / demander l'accès |
| `GET` | `/api/spaces` | liste publique + méthodes actives + mon appartenance |
| `GET` | `/api/spaces/[slug]` | détail + méthodes actives + membres + mon appartenance |

Corps du `POST` : `{ method, code?, token?, message? }`.

## Données

`memberships`, `space_access_methods`, `space_access_log`. **Aucune nouvelle table, aucune
migration** : une demande en attente est une appartenance `verification_level='unverified'`
avec `verified_via='manual_approval'`.

## Sécurité et autorisation

- `requireSession()` obligatoire ; l'identité vient de la session, jamais de la requête.
- `guardMutation` (contrôle `Origin` + rate-limit 20/min).
- Le code d'invitation et le jeton sont stockés **hachés** (SHA-256), comparaison à temps
  constant (`timingSafeEqual`).
- Les DTO n'exposent ni `userId`, ni `code`, ni `token`, ni clé de stockage.

## Critères d'acceptation

- [ ] Given un espace public `open`, When un utilisateur rejoint, Then membre `unverified`,
      `verified_via='open'`, un accès `join` journalisé.
- [ ] Given un espace `invite_code`, When le code est faux, Then `400` sans création.
- [ ] Given `invite_code` valide, Then membre `verified`, `verified_via='invite_code'`.
- [ ] Given `manual_approval`, Then demande en attente ; l'approbation (F17) → `verified`.
- [ ] Given un espace privé, When un non-membre tente, Then `404`.
- [ ] Given un membre existant, When il rejoint, Then `409`.
- [ ] Toute action réussie écrit une ligne `space_access_log`.

## Tests attendus

- Unitaires (repos mockés) : résolution de chaque `AccessMethod`, cas `404`/`409`, hachage.
- Intégration (`*.integration.test.ts`, base réelle opt-in) : contrainte unique, journal.

## Hors périmètre

`email_domain` (F29, V2).
