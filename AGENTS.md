# Réseau social modulable

Réseau social ouvert à une communauté curieuse. Premier profil ciblé : étudiant
(évolution de CampusConnect). Le profil déduit des activités publiées sert à générer
un CV et à être recruté sur ce que la personne sait réellement faire.
D'autres profils suivront (entrepreneurs, etc.) : le cœur doit rester générique.

> Ce fichier est la source unique des règles du projet. Il est lu par OpenCode,
> et importé par CLAUDE.md pour Claude Code.

## Stack
Next.js · GraphQL · Neon (Postgres) · Render · WebRTC · chiffrement de bout en bout.
Détails : docs/architecture.md, docs/base-de-donnees.md, docs/deploiement.md.

## Commandes
- Installer : `npm install`
- Dev : `npm run dev`
- Tests : `npm test`
- Lint : `npm run lint`
- Build : `npm run build`
(Adapter si la stack change.)

## Règles détaillées (à lire selon la tâche)
- GraphQL : .claude/rules/graphql.md
- Chiffrement E2E : .claude/rules/chiffrement-e2e.md
- WebRTC : .claude/rules/webrtc.md
- Profils modulaires : .claude/rules/profils-modulaires.md
- Données personnelles : .claude/rules/donnees-personnelles.md
- Base de données (Neon) : .claude/rules/base-de-donnees.md

## Workflow git
- 1 tâche = 1 branche = 1 worktree.
- Jamais de travail direct sur `main` depuis un worktree de tâche.
- Petits commits ; le projet doit fonctionner à chaque commit.
- Ne jamais fusionner dans `main` sans mon accord. Ne jamais déployer depuis un worktree de tâche.
- Créer un worktree à la main : `git worktree add ../reseau-social-<tache> -b <tache>`
- Supprimer après fusion : `git worktree remove ../reseau-social-<tache>` puis `git branch -d <tache>`

## Définition de "terminé"
Tests, lint et build passent, tout est commité, les règles de sécurité sont respectées.
Si une vérification échoue, le dire clairement : ne jamais prétendre que c'est fini.

## Règles non négociables
- Messages privés chiffrés de bout en bout : le serveur ne voit jamais de contenu en clair
  ni de clé privée.
- Le cœur ne contient rien de spécifique au profil étudiant.
- Pas de fonctionnalité hors de la phase en cours (docs/phases.md). Une idée utile se note
  dans docs/phases.md au lieu d'être codée.
- Les agents de développement n'accèdent qu'à la base Neon de développement, jamais à la production.
- Aucun secret dans le code, les logs, les commits ou les conversations.
- supprime les fichiers qui deviennent obsolete en me demandant l'autorisation 
-quand la memoire est plein supprime des cache et vide le temp et garde la commande de suppression dans un script sh dans @.opencode/scripts 

## Brainstorming
Quand je dis "brainstorm ou je veux travailler sur une partie du projet ou ma phrase a un sens qui se dirige vers un reflexion complexe" : aucun fichier de code modifié. Procédure : docs/brainstorming.md.

## Agents (rôles)
Instructions détaillées dans docs/agents/ :
architecte, backend, frontend, securite, devops.
