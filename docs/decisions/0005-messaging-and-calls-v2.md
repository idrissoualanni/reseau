# ADR 0005 — Messagerie chiffrée et appels reportés en V2

- **Statut** : accepté · **Date** : 2026-10-08

## Contexte
La messagerie chiffrée de bout en bout et les appels WebRTC ne servent pas la proposition de valeur de départ (profil + preuves + projets) et ajoutent une forte complexité.

## Décision
Les deux sont **V2**, dans un service séparé `apps/realtime` (WebSocket) avec TURN géré.

## Périmètre prévu pour la V2 (à confirmer avant de commencer)
- Messagerie 1 à 1, texte seul ; chiffrement de bout en bout avec la Web Crypto API ; clé privée jamais envoyée au serveur ; un seul appareil par compte ; pas de groupe ni de pièce jointe.
- Perte de la clé = historique illisible (avertissement clair).
- Appels : audio 1 à 1 d'abord, puis vidéo ; signalisation par le service realtime ; TURN externe géré (Render n'expose pas d'UDP public à ma connaissance : à vérifier).

## Conséquences
Aucun code, table ni dépendance de messagerie/appel en V1.
