---
description: Règles WebRTC — appels audio/vidéo, partage d'écran, STUN/TURN. V2 uniquement. Dépend de websocket.md.
paths:
  - apps/realtime/src/handlers/call.ts
  - apps/web/src/modules/calls/**
  - apps/web/src/app/api/realtime/ice/**
  - apps/web/src/lib/ice.ts
---

# Règle WebRTC (appels)

## 0. Statut : V2 — INTERDIT EN V1
- Aucun code WebRTC en V1. Prérequis : `websocket.md` appliqué (la signalisation passe par WebSocket) et un ADR (`docs/adr/0004-webrtc.md`).
- Phasage : **audio 1-1 → vidéo 1-1 → partage d'écran → groupes (SFU, hors périmètre)**. Ne pas sauter d'étape.

## 1. Principe
WebRTC envoie audio, vidéo ou données **directement d'un appareil à l'autre**, chiffrés automatiquement (DTLS-SRTP). Le serveur ne sert qu'à les mettre en contact (**signalisation**). Trois briques :
| Brique | Rôle | Où |
|---|---|---|
| Signalisation | Échanger `offer`, `answer`, `ice` | WebSocket (`websocket.md`) |
| STUN | Découvrir son adresse publique | Serveur public gratuit |
| TURN | Relais si le chemin direct échoue (CGNAT mobile, réseaux d'université) | Fournisseur ou VPS |

Sans TURN, l'appel échoue sur une partie des réseaux mobiles et d'entreprise.

## 2. Fonctionnalités servies

| Fonctionnalité | Intérêt | Phase |
|---|---|---|
| Appel audio 1-1 | Mentor-étudiant, recruteur-candidat | V2.0 |
| Appel vidéo 1-1 | Entretiens, mentorat | V2.1 |
| Partage d'écran (`getDisplayMedia`) | Montrer un projet, expliquer du code | V2.2 |
| Messages vocaux | `getUserMedia` + `MediaRecorder`, **sans** connexion pair à pair ; upload HTTP | V2.0 |
| Appel entrant / manqué / refusé / occupé | Gestion d'état d'appel | V2.0 |
| Salles d'étude, webinaires d'université | Exige un **SFU** (LiveKit) — ADR séparé | V3 |
| Édition collaborative (DataChannel) | Projets d'équipe | V3+ |
| Transfert de fichiers pair à pair | Non retenu : upload HTTP plus simple | — |

## 3. Choix du TURN : abstraction par fournisseur
Le code ne dépend jamais d'un fournisseur précis. Tout passe par `apps/web/src/lib/ice.ts` :
```ts
// Contrat : renvoie la liste ICE à donner à RTCPeerConnection
export async function getIceServers(userId: string): Promise<RTCIceServer[]>
```
Le fournisseur se choisit par variable d'environnement `TURN_PROVIDER` : `cloudflare` | `metered` | `coturn` | `none`.

| Fournisseur | Gratuit ? | Usage conseillé |
|---|---|---|
| `none` (STUN public seul) | Oui, illimité | Développement local, premiers tests |
| `cloudflare` (Realtime TURN) | 1 000 Go/mois offerts, puis 0,05 $/Go | **Choix par défaut** (Cloudflare déjà dans l'infra) |
| `metered` (Open Relay) | 20 Go/mois offerts | Secours, tests rapides |
| `coturn` (VPS) | Coût fixe du VPS | Quand les appels deviennent réguliers |

À vérifier dans la documentation du fournisseur avant d'implémenter : conditions du palier gratuit et format exact de l'API de génération d'identifiants (les offres évoluent).

## 4. Variables d'environnement (jamais committées, jamais `NEXT_PUBLIC_`)
```env
TURN_PROVIDER=cloudflare
STUN_URL=stun:stun.l.google.com:19302
# cloudflare
CLOUDFLARE_TURN_KEY_ID=
CLOUDFLARE_TURN_API_TOKEN=
# metered
METERED_APP_NAME=
METERED_API_KEY=
# coturn
TURN_URL=turn:turn.exemple.com:3478
TURNS_URL=turns:turn.exemple.com:5349
TURN_SECRET=
```
Lues uniquement dans `lib/env.ts`. `.env*` dans `.gitignore`. Production : variables Render.

## 5. Endpoint d'identifiants
`GET /api/realtime/ice` (session requise, `Cache-Control: no-store`) :
- Appelle `getIceServers(ctx.userId)`.
- Renvoie `{ iceServers: [...] }`. **Identifiants éphémères** (durée 1 à 24 h), jamais statiques, jamais le secret.
- Limiter le débit par utilisateur (ex. 20 requêtes/heure).
- Implémentations :
  - `cloudflare` : l'API Cloudflare génère des identifiants temporaires à partir de la clé TURN (le token reste côté serveur).
  - `metered` : l'API Metered renvoie la liste ICE à partir de la clé API (côté serveur).
  - `coturn` : `username = "<expiration>:<userId>"`, `credential = base64(HMAC-SHA1(TURN_SECRET, username))`.
  - `none` : `[{ urls: STUN_URL }]`.

## 6. Contrat de signalisation (via WebSocket)
Messages définis dans `packages/shared/src/realtime/call.ts` :
| Type | Payload | Sens |
|---|---|---|
| `call.offer` | `{ callId, to, media: "audio"|"video", sdp }` | appelant -> appelé |
| `call.answer` | `{ callId, sdp }` | appelé -> appelant |
| `call.ice` | `{ callId, candidate }` | les deux sens |
| `call.reject` | `{ callId, reason: "declined"|"busy" }` | appelé -> appelant |
| `call.end` | `{ callId }` | les deux sens |
- `callId` = UUID créé par l'appelant. Le serveur vérifie que chaque message appartient à un appel dont l'émetteur est participant.
- Autorisation : seul un utilisateur ayant le droit de contacter le destinataire peut envoyer `call.offer` (même règle que la messagerie).
- Timeout de sonnerie : 45 s sans réponse -> appel manqué (le serveur envoie `call.end`).
- Un utilisateur = un appel à la fois ; sinon réponse automatique `busy`.

## 7. Machine d'états côté client (obligatoire)
`idle -> calling -> ringing -> connecting -> connected -> ended`
Chaque transition est explicite dans un `useReducer` ou une machine d'états ; interdit de déduire l'état de plusieurs booléens.

## 8. Règles d'implémentation client
Dans `apps/web/src/modules/calls/` :
```
components/   CallScreen, IncomingCallDialog, CallControls
application/  startCall, answerCall, endCall (logique, sans React)
hooks/        useCall (état + RTCPeerConnection)
```
1. Récupérer `iceServers` via `/api/realtime/ice` **avant** de créer `RTCPeerConnection`.
2. `getUserMedia` d'abord ; ajouter les pistes (`addTrack`) **avant** `createOffer` / `createAnswer`.
3. **File d'attente ICE** : tout candidat reçu avant `setRemoteDescription` est mis en attente puis appliqué ensuite.
4. Envoyer chaque candidat par `call.ice` dès `onicecandidate`.
5. Raccrocher : `pc.close()` **et** `track.stop()` sur chaque piste (sinon le voyant caméra reste allumé).
6. Gérer `iceconnectionstatechange` : sur `failed`, tenter un `restartIce()` une fois, puis terminer l'appel avec un message clair.
7. Gérer les refus de permission micro/caméra avec un message explicite.
8. HTTPS obligatoire (sauf `localhost`).

## 9. Bande passante (public mobile, data coûteuse)
- **Audio par défaut.** La vidéo est activée volontairement.
- Contraintes vidéo : `{ width: 640, height: 360, frameRate: 15 }` maximum par défaut ; HD jamais par défaut.
- Avertir avant un appel vidéo : environ 150 à 270 Mo par heure en 360p.
- Repères : audio Opus ~15 Mo/h ; vidéo 360p ~150-270 Mo/h ; 1 Mbps pendant 1 h = 450 Mo.
- Permettre de couper la vidéo en cours d'appel (`track.enabled = false`).

## 10. Sécurité et vie privée
- Aucun SDP ni candidat ICE stocké ni logué (ils contiennent des adresses IP).
- Secrets TURN jamais exposés au navigateur.
- Bloquer/ignorer les appels d'un utilisateur bloqué ; pas d'appel entre inconnus (connexion acceptée requise).
- Si E2E sur la messagerie, l'audio/vidéo WebRTC est déjà chiffré de bout en bout entre pairs ; avec TURN le relais ne voit que du trafic opaque.
- Journaliser uniquement : `callId`, participants, durée, issue (terminé, manqué, refusé, échec réseau).

## 11. Tests exigés
- Unitaires (Vitest) : génération d'identifiants coturn (format et expiration), machine d'états, file d'attente ICE.
- Manuels (tracés dans `docs/qa/webrtc.md`) : appel entre **deux appareils sur deux réseaux différents** (Wi-Fi + 4G), puis refus, occupé, manqué, coupure réseau en cours d'appel.
- Test TURN : outil Trickle ICE de WebRTC (`webrtc.github.io/samples/src/content/peerconnection/trickle-ice/`) ; des candidats de type `relay` prouvent que TURN fonctionne.

## 12. Interdits
- WebRTC en V1.
- Identifiants TURN statiques ou secret côté navigateur.
- Tester sur un seul appareil / un seul réseau et considérer la fonctionnalité terminée.
- Appels de groupe en pair à pair maillé (saturation 4G) : utiliser un SFU (ADR).
- Lier le code métier à un fournisseur TURN : passer par `lib/ice.ts`.
- Stocker SDP / ICE.

## 13. Pièges fréquents
1. Pas de HTTPS -> `getUserMedia` bloqué.
2. Candidats ICE reçus avant l'offre -> les mettre en file.
3. `addTrack` oublié avant `createAnswer` -> rien n'est reçu ni envoyé.
4. Marche en Wi-Fi, échoue en 4G -> TURN absent ou mal configuré.
5. Pistes non arrêtées -> voyant caméra allumé.