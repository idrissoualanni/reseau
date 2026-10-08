# Environnements et déploiement

## Les trois briques
- **Render** héberge les services. Hiérarchie : *workspace → project → environment → service*. Un projet `reseau` contient les environnements `dev` et `production`. Les **environment groups** partagent des variables à l'intérieur d'un environnement sans fuite vers l'autre. Les noms de services sont uniques dans tout le workspace (`reseau-web-dev`, `reseau-web-prod`).
- **Neon** fournit Postgres, Auth et Storage. Tout est **par branche** : la branche Neon `dev` a ses propres utilisateurs, données et fichiers ; la branche `main` est la production. Les données de dev ne touchent jamais la production.
- **Cloudflare** : DNS, CDN, WAF, limitation de débit, Turnstile (anti-robot).

## Correspondance environnements
| Git | Render | Neon | Domaine |
|---|---|---|---|
| `feat/*` (worktree local) | — | branche Neon éphémère ou `dev` | localhost |
| `dev` | `reseau-web-dev` | branche `dev` | `dev.<domaine>` |
| `main` | `reseau-web-prod` | branche `main` | `app.<domaine>` |

## Flux de livraison
1. Branche `feat/Fxx-slug` (worktree) → PR vers `dev` → CI (lint, typecheck, tests).
2. Merge dans `dev` → Render déploie **dev** automatiquement.
3. Validation manuelle sur dev avec la checklist de la fiche (critères d'acceptation).
4. `/release` : PR `dev` → `main`, mise à jour du CHANGELOG, tag SemVer → Render déploie **production**.
5. Hotfix : branche depuis `main`, PR vers `main`, puis rétro-fusion dans `dev`.

## Migrations
- Générées avec drizzle-kit, versionnées dans `packages/db/migrations/`.
- Appliquées **sur dev d'abord** (étape de build ou commande de pré-déploiement), jamais sur production avant validation.
- Style *expand puis contract* : ajouter (nullable) → déployer → migrer les données → contraindre/supprimer dans une version ultérieure.
- Utiliser `DATABASE_URL_UNPOOLED` pour les migrations.

## Variables d'environnement
Voir `.env.example`. Dev et production ont des valeurs distinctes ; les secrets se saisissent dans Render (`sync: false`), jamais dans `render.yaml`.

## Cloudflare (à configurer)
- Proxy DNS activé, SSL/TLS « Full (strict) ».
- Règle de limitation de débit sur `/api/auth/*` et `/api/uploads/*`.
- Turnstile sur le formulaire d'inscription (F01).
- Mise en cache des images : compatibilité avec le bucket Neon Storage **à vérifier** (domaine personnalisé ou `public_read`) avant de s'y engager.
- Les images ne passent pas par Cloudflare R2 : le stockage est Neon Storage.

## Blueprint (`render.yaml`)
Voir le fichier racine. Valider avec `render blueprints validate` (aussi en CI). Le serveur MCP Render peut servir à l'agent `devops` pour consulter logs et déploiements. Preview environments par PR : non activés en V1.

## Santé et observabilité minimales
`GET /api/health` (statut app + test de connexion base). Logs structurés sans donnée personnelle. Alerte Render sur échec de déploiement.
