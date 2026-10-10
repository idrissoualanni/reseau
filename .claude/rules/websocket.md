---
description: Règles du temps réel (WebSocket) — messagerie, présence, notifications, signalisation WebRTC. V2 uniquement.
paths:
  - apps/realtime/**
  - packages/shared/src/realtime/**
  - apps/web/src/modules/messaging/**
  - apps/web/src/app/api/realtime/**
---

# Règle WebSocket (temps réel)

## 0. Statut : V2 — INTERDIT EN V1
- La V1 = les 10 fonctionnalités du profil. Aucun WebSocket, aucun `apps/realtime`, aucune dépendance `ws` en V1.
- Avant de créer `apps/realtime`, il faut un **ADR dédié** (`docs/adr/0003-realtime.md`) validé par l'humain.
- Si une tâche V1 semble avoir besoin du temps réel : STOP, utiliser une requête HTTP classique, signaler le besoin.

## 1. Ce qu'est un WebSocket (rappel pour l'agent)
Une connexion qui reste ouverte entre le client et le serveur. Les deux côtés envoient des messages quand ils veulent. Le WebSocket **ne stocke rien** et **ne remplace pas l'API** : il sert à *pousser* des événements.

## 2. Fonctionnalités servies

| Fonctionnalité | WebSocket ? | Phase |
|---|---|---|
| Messagerie 1-1 (texte) | Oui | V2 |
| Indicateur « est en train d'écrire » | Oui | V2 |
| Présence (en ligne / hors ligne) | Oui | V2 |
| Accusés de lecture / de réception | Oui | V2 |
| Notifications instantanées (nouvelle connexion, nouveau projet suivi) | Oui | V2 |
| **Signalisation WebRTC** (offer, answer, ice) | Oui — voir `webrtc.md` | V2 |
| Appel entrant / refusé / occupé / manqué | Oui | V2 |
| Messages de groupe, salles par espace/université | Oui | V2+ |
| Compteurs en direct (likes, vues) | Possible, non prioritaire | V3 |
| Fil d'actualité, profil, CV, recherche | **Non** : HTTP/GraphQL | — |

## 3. Architecture
```
apps/
  web/        Next.js (HTTP, GraphQL, REST) — émet les tickets de connexion
  realtime/   Service Node dédié (ws) — connexions longues
packages/shared/src/realtime/   Schémas Zod des messages (source unique de vérité)
```
- Next.js n'héberge **jamais** de WebSocket (routes courtes uniquement).
- `apps/realtime` est un **Web Service Render séparé**, toujours allumé (pas d'offre qui s'endort), avec health check `/health`.
- `apps/realtime` n'accède pas à la base directement pour la logique métier : il appelle les cas d'usage de `application/` (même règle de couches que `architecture.md`).
- Bibliothèque : `ws` (standard). Socket.IO uniquement si l'ADR le justifie.
- Une seule instance au début. Pour plusieurs instances : Redis Pub/Sub entre instances (nouvel ADR).

## 4. Format des messages (obligatoire)
Tous les messages sont du JSON validé par Zod `.strict()` dans `packages/shared/src/realtime/`.

```json
{ "v": 1, "type": "message.send", "id": "uuid-client", "payload": { ... } }
```
- `v` : version du protocole. `type` : `domaine.action`. `id` : identifiant unique côté émetteur (idempotence).
- Types prévus : `message.send`, `message.new`, `message.read`, `typing.start`, `typing.stop`, `presence.update`, `notification.new`, `call.offer`, `call.answer`, `call.ice`, `call.end`, `call.reject`, `ping`, `pong`, `error`.
- Tout message inconnu ou invalide → réponse `error` `{ code: "INVALID_MESSAGE" }`, jamais de crash.
- Erreur : `{ "type": "error", "payload": { "code", "message", "refId" } }` (même esprit que l'erreur unique REST).

## 5. Authentification (point critique)
Le navigateur ne peut pas mettre d'en-tête personnalisé dans `new WebSocket()`. Procédure imposée :
1. Le client appelle `POST /api/realtime/ticket` (session Neon Auth requise).
2. Next.js renvoie un **ticket à usage unique, valable 30 secondes**, signé et lié au `userId`.
3. Le client ouvre `wss://…/ws?ticket=…`.
4. `apps/realtime` vérifie la signature, l'expiration, l'usage unique, puis ferme avec code `4401` sinon.
- Jamais de `userId` envoyé par le client dans un message : il vient du ticket.
- Le ticket n'est jamais loggé (masquer la query string dans les logs).

## 6. Autorisation à chaque message
Vérifier **à chaque message**, pas seulement à la connexion :
- l'utilisateur appartient à la conversation ;
- il a le droit de contacter le destinataire (connexion acceptée, non bloqué) ;
- `application/` porte cette règle, pas le handler WebSocket.

## 7. Persistance avant diffusion
Ordre imposé pour tout message qui doit survivre : **valider → autoriser → enregistrer en base → accuser réception à l'émetteur → diffuser aux destinataires connectés.**
- Les événements éphémères (`typing`, `presence`, `call.ice`) ne sont **jamais** enregistrés.
- Un destinataire hors ligne retrouve ses messages par l'API HTTP (`GET /api/conversations/{id}/messages?cursor=`).
- Les SDP / candidats ICE ne sont jamais stockés.

## 8. Messagerie chiffrée (E2E)
- Le serveur relaie et stocke un **texte chiffré opaque** (`ciphertext`, `nonce`, `senderKeyId`). Il ne lit, n'indexe et ne logge jamais le contenu.
- Les clés privées ne quittent jamais l'appareil. Le serveur ne stocke que les clés publiques.
- Le protocole de chiffrement et la gestion des clés ont leur propre ADR (hors de cette règle).

## 9. Santé de la connexion
- **Heartbeat** : le serveur envoie un `ping` toutes les 30 s ; sans `pong` sous 10 s → fermeture.
- **Reconnexion client** (obligatoire, mobile) : délai croissant 1 s, 2 s, 4 s, 8 s… plafonné à 30 s, avec aléa (jitter) ; nouveau ticket à chaque tentative.
- **Rattrapage** : à la reconnexion, le client appelle l'API HTTP avec `after=<dernier id reçu>` pour récupérer les messages manqués. Ne jamais compter sur le WebSocket pour rejouer.
- **Déduplication** : le client ignore un `id` déjà vu.
- Écouter `online` / `offline` du navigateur et `visibilitychange` pour suspendre/reprendre.

## 10. Limites (protection et bande passante)
| Limite | Valeur de départ |
|---|---|
| Taille maximale d'un message | 16 Ko (rejeter au-delà) |
| Messages par seconde et par utilisateur | 10 (au-delà : `RATE_LIMITED`) |
| Connexions simultanées par utilisateur | 3 |
| Contenu binaire (images, fichiers) | **Interdit** sur le WebSocket : upload HTTP, puis envoi de l'URL |
- Pas de gros payload : le public est mobile avec data limitée.

## 11. Exploitation (Render + Cloudflare)
- `wss://` uniquement en production ; `ws://` seulement en local.
- Gérer `SIGTERM` : arrêter d'accepter, envoyer `close` code `1012` (redémarrage), laisser les clients se reconnecter.
- Cloudflare devant le service : WebSocket supporté ; ne pas mettre de cache sur `/ws`.
- Logs : `userId`, `type`, durée, code d'erreur. **Jamais** le contenu des messages.
- Variables : `REALTIME_TICKET_SECRET` (partagé avec `apps/web`), `DATABASE_URL`, `ALLOWED_ORIGINS`. Lues dans `lib/env.ts` uniquement.
- Vérifier l'en-tête `Origin` contre `ALLOWED_ORIGINS` à la connexion.

## 12. Structure du service `apps/realtime`
```
src/
  server.ts              création du serveur, health check, arrêt propre
  connection.ts          ticket, heartbeat, registre des connexions
  router.ts              type de message -> handler
  handlers/              un fichier par domaine (message.ts, typing.ts, call.ts, presence.ts)
  lib/env.ts             variables d'environnement
```
Un handler : valide (Zod) → appelle `application/` → renvoie ou diffuse. Aucune logique métier dedans.

## 13. Tests exigés (Vitest)
- Ticket expiré, rejoué, falsifié → refusé.
- Message invalide, trop gros, trop fréquent → `error`, connexion conservée (sauf abus répété).
- Utilisateur hors conversation → refusé.
- Message enregistré avant diffusion ; hors ligne → récupérable par HTTP.
- Reconnexion : aucun doublon, aucun trou.

## 14. Interdits
- WebSocket en V1.
- Logique métier dans un handler.
- `userId` lu depuis le message client.
- Envoyer des fichiers/binaires par WebSocket.
- Stocker des SDP ou candidats ICE.
- Logger le contenu des messages.
- Passer à plusieurs instances sans bus de messages.

## 15. Alternatives (à connaître avant de décider)
| Besoin | Choix |
|---|---|
| Notifications seules (serveur -> client) | SSE suffit, plus simple |
| Chat + présence + signalisation WebRTC | WebSocket |
| Zéro serveur à maintenir | Service managé (Ably, Pusher) — nouvel ADR |