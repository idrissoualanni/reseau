# Phases

On ne travaille que sur la phase en cours. Les idées qui apparaissent ailleurs se
notent en bas.

## Phase en cours : V2 — Messagerie chiffrée

La V1 et la V1.5 sont livrées (profils, projets, posts, espaces, administration,
stockage). Les vérifications navigateur authentifiées restent suivies dans
`docs/TODO.md`.

Périmètre V2 :

- messagerie **1 à 1** chiffrée de bout en bout (texte + réactions emoji) ;
- live queries Neon Realtime pour les messages, réactions et accusés de lecture ;
- saisie et présence via Neon Functions, sans persistance ;
- liste de conversations et fil de messages avec pagination ;
- UI shadcn (`bubble`, `message`, `message-scroller`, `sidebar`) et tokens du projet ;
- galerie de 5 images (couverture = première) pour les posts et projets ;
- séparation logique de l'administration et suivi des envois OTP.

Critère de réussite : deux comptes vérifiés échangent des messages chiffrés en temps
réel ; le serveur ne voit jamais de contenu clair ni de clé privée ; tests, lint,
typecheck et build passent ; le parcours est vérifié sur le service Render dev.

## Phases suivantes (ne pas coder)

- V2.5 : pièces jointes chiffrées, messages de groupe, blocage et signalement.
- V3 : appels WebRTC audio/vidéo avec TURN géré.
- V4 : autres types de profil (entrepreneurs) et intégration des universités.

## Idées en attente

- Notifications push natives et e-mail de nouveau message.
- Recherche dans les conversations (côté client, sans indexation serveur).
- Sauvegarde de clé E2E multi-appareils (nécessite un protocole dédié).
