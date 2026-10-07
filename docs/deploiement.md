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

## production
-avant de passer en production il faut verifie qu'une validation de la version dev a ete fait et aprouver 
