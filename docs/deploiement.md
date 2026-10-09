# Déploiement (Render)

Prérequis : dossier principal, branche `main`, arbre git propre, tests / lint / build verts.

1. Vérifier que les migrations de la branche ont été validées par moi.
2. Appliquer les migrations sur la base de production (étape manuelle ou validée par moi).
3. Pousser `main` : Render redéploie automatiquement à chaque push sur la branche liée.
4. Consulter l'état du déploiement et les logs via Render (MCP).
5. Tester les parcours clés : connexion, publication, messagerie.
6. En cas d'échec : ne pas insister, me prévenir, proposer un retour à la version précédente.

## Interdits pour l'agent devops
- Modifier le code métier.
- Modifier les variables d'environnement Render sans mon accord explicite.
- Déployer depuis un worktree de tâche ou depuis une autre branche que `main`.

## Variables d'environnement
Les noms sont dans `.env.example`. Les valeurs de production se saisissent dans Render, jamais dans le dépôt.

## Services Render (à confirmer)
- Application Next.js (service web).
- Serveur de signalisation WebRTC (service web séparé). Une instance gratuite s'endort :
  prévoir une instance payante pour la signalisation afin d'éviter les démarrages à froid.

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

## production
-avant de passer en production il faut verifie qu'une validation de la version dev a ete fait et aprouver 
