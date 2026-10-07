# Architecture

> Version de départ à valider pendant la phase 1. Les points marqués (à décider) restent ouverts.

## Vue d'ensemble
- **Application web** : Next.js, déployée comme service web Render (serveur Node durable).
- **API** : un point d'entrée GraphQL (route Next.js `/api/graphql`). REST uniquement pour des cas justifiés
  (webhook externe, upload de fichiers).
- **Base de données** : Neon (Postgres). Branche principale = production ; branche `dev` = développement.
- **Temps réel** : notifications par subscriptions GraphQL (à décider : transport) ;
  appels par WebRTC avec un serveur de signalisation séparé (petit service Node + WebSocket) sur Render.
- **Chiffrement** : de bout en bout pour les messages privés, côté client.
- **ORM / migrations** : (à décider : Drizzle ou Prisma). Les migrations sont des fichiers versionnés.

## Principe de modularité
```
cœur (agnostique)                 modules de profil
├── utilisateurs                  ├── etudiant   (champs, déduction de compétences, modèle de CV)
├── publications / activités      ├── entrepreneur (plus tard)
├── relations (réseau)            └── ...
├── messagerie chiffrée
└── organisations (universités)
```
Le cœur ne connaît aucun type de profil. Un module s'enregistre auprès du cœur
(voir le skill `nouveau-type-de-profil`).

## Flux principaux
1. **Publication** : l'utilisateur publie une activité → des compétences sont proposées → l'utilisateur valide.
2. **Profil** : agrégation des compétences validées → génération du CV (uniquement ce qui est validé).
3. **Messagerie** : le client chiffre → le serveur stocke du chiffré → le destinataire déchiffre.
4. **Appel** : signalisation (offre/réponse/ICE) via le serveur de signalisation, flux média chiffrés par WebRTC.

## Environnements
| Environnement | App | Base |
|---|---|---|
| Local | `npm run dev` | branche Neon `dev` |
| Production | service Render, branche `main` | branche Neon principale |
