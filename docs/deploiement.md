# Déploiement (Render)

## État réel — 2026-10-26

| | |
|---|---|
| Projet Render | `reseau` |
| Service web **dev** | `reseau` — `srv-db4ek92jnfac73b4uij0` |
| Branche | `dev` |
| URL | https://reseau-3tuk.onrender.com |
| Runtime | Node (Next.js, racine du dépôt) |
| Build | `npm ci && npm run build` |
| Start | `npm start` |
| Health check | `/api/health` |
| Base | Neon `reseau`, branche `dev` |
| Frontend | **dans le même service Next.js** (`src/app`) — aucun service frontend séparé |
| Temps réel | Neon Realtime + Neon Functions (pas de `apps/realtime`) |

Le service `reseau-web-dev` et le service `srv-db46e4btqb8s73e8bsd0` ont été
supprimés. Ne pas les recréer.

Prérequis : worktree de tâche mergé sur `dev`, arbre git propre, tests / lint /
typecheck / build verts, migrations additives appliquées sur Neon **dev**.

1. Vérifier que les migrations ont été validées et appliquées sur Neon dev.
2. Pousser `dev` : Render redéploie automatiquement.
3. Consulter l'état et les logs via Render (MCP ou CLI).
4. Sonder `/api/health`, `POST /api/graphql`, `/sign-in`, `/sign-up`, puis les
   parcours clés.
5. En cas d'échec : ne pas insister, prévenir, proposer un retour arrière.

**Ne jamais déployer depuis `main` sans accord.** Le dev se déploie depuis `dev`.

## Interdits pour l'agent devops
- Modifier le code métier.
- Modifier les variables d'environnement Render sans accord explicite.
- Déployer depuis un worktree de tâche ou depuis une autre branche que `dev`.

## Variables d'environnement
Les noms sont dans `.env.example`. Les valeurs se saisissent dans Render, jamais dans
le dépôt. Pour la V2 : `NEON_REALTIME_URL` et `NEON_REALTIME_SECRET`
(**serveur uniquement**, jamais préfixé `NEXT_PUBLIC_`).

## Services Render
- **Un seul service web Next.js** pour le frontend, l'API REST, GraphQL et l'auth.
- **Aucun service de signalisation** en V2 : la saisie/présence passe par Neon
  Functions. La signalisation WebRTC/TURN est en V3.
- Neon Realtime est un service managé Neon, pas un service Render.

## Historique — état du 07/10/2026 (obsolète)

> Conservé pour traçabilité. Ne pas utiliser pour recréer l'infrastructure : voir
> l'état réel ci-dessus.

## État vérifié le 07/10/2026 (MCP Render + CLI)

| | |
|---|---|
| Projet | `reseau` — `prj-db2taffavr4c7391bp9g` |
| Environnement | `dev` — `evm-db2taffavr4c7391bpa0` |
| Services web | aucun |
| Postgres | aucun |
| Key Value | `reseau-dev` — `red-db2tm6t9fdbs7398hdmg` (frankfurt, free) |

Le MCP Render (23 outils) ne possède **aucun endpoint projet/environnement** : les noms
ci-dessus viennent de la CLI, le MCP ne confirme que l'`environmentId` de la Key Value.

## Configuration cible du service web — rien n'est créé

| Paramètre | Valeur cible | Pourquoi |
|---|---|---|
| `runtime` | `docker` | Seul chemin sans `buildCommand`/`startCommand` : il lit le `Dockerfile` racine |
| `dockerfilePath` | `./Dockerfile` | |
| `dockerContext` | `.` | |
| `region` | `frankfurt` | Même région que `reseau-dev` |
| `autoDeploy` | `yes` | Redéploiement à chaque push sur la branche liée |
| `branch` | `main` | Interdit de déployer depuis un worktree de tâche |
| `plan` | `free`, payant pour la signalisation | cf. « Services Render » ci-dessus |

### Blocages avant création

1. **Aucun remote git** — Render doit cloner le dépôt (`repo` requis en pratique).
2. **Pas encore d'application** — `package.json` n'a ni `scripts` ni `next` : le build échouerait.
3. **`create_web_service` n'a aucun paramètre projet/environnement** — le service créé
   tomberait **hors** du projet `reseau` / env `dev`. À créer depuis le Dashboard, ou à déplacer ensuite.

## Production
- Ne pas déployer en production avant validation complète du dev et accord explicite.
- La production utilisera la branche Neon `main` et un service Render séparé.
- `NEON_REALTIME_*` devra être activé sur la branche `main` avant le premier déploiement
  de messagerie en production.
