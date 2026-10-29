---
description: Règles du temps réel V2 — Neon Realtime pour les lignes et les signaux courts.
paths:
  - src/modules/messaging/**
  - src/app/api/conversations/**
  - src/app/api/messages/**
  - src/app/api/realtime/**
  - functions/**
---

# Règle temps réel (V2)

## 0. Statut

- Le temps réel est autorisé **en V2 uniquement**.
- Architecture retenue : **Neon Realtime** pour les lignes persistées **et** pour
  les signaux courts (saisie, présence).
- `apps/realtime` n'est **pas** créé. Un service dédié exigerait un nouvel ADR et une
  mesure prouvant que Neon Functions ne suffit pas.
- La V1 et la V1.5 ne doivent pas dépendre du temps réel.

## 1. Répartition des transports

| Besoin | Transport | Persisté ? |
|---|---|---|
| Messages, réactions, accusés | Neon Realtime (live query scellée) | Oui, Postgres |
| Liste des conversations / non lus | Neon Realtime | Oui |
| Saisie (`typing`) | Neon Realtime + table `conversation_typing` | Éphémère, expiré côté client (6 s) |
| Présence | Neon Realtime + table `profile_presence` | Battement 45 s, en ligne < 90 s |
| Signalisation WebRTC | V3 — décision séparée | Non |
| Historique / envoi | REST Next.js | Oui |
| Fil, profil, recherche | HTTP/GraphQL | Oui |

## 2. Écritures

- Une écriture ne passe **jamais** par le WebSocket.
- Ordre : valider → autoriser → persister → renvoyer l'`id` / `txid` → laisser la live
  query pousser la ligne.
- L'identité vient de la session serveur. Aucun `userId` client n'est accepté.
- Idempotence : `clientId` unique par envoi.
- Limite : 16 Ko par message chiffré, 10 messages/s/utilisateur (à ajuster).

## 3. Live queries

- La requête est définie **côté serveur**, avec des paramètres liés.
- Elle est **scellée** par `NEON_REALTIME_SECRET` ; le client ne peut ni la lire ni la
  modifier.
- Le SQL filtre explicitement l'appartenance (`conversation_participants`).
- Une requête par conversation (messages, saisie, présence). Pas de SQL arbitraire client.
- Renouveler la requête scellée avant expiration ; gérer `error` et la reconnexion.
- Ne jamais mettre `NEON_REALTIME_SECRET` dans un bundle, un log ou une URL.
- Le navigateur ne reçoit que `NEXT_PUBLIC_NEON_REALTIME_URL` (même URL `wss://`).
- Aucun polling de la liste : focus, actions et live query suffisent.

## 4. Signaux courts (saisie, présence)

- Saisie : `POST /api/conversations/[id]/typing`, upsert `conversation_typing`,
  suppression à l'arrêt ; throttle client 2,5 s, expiration 6 s.
- Présence : `POST /api/presence`, upsert `profile_presence.last_seen_at` ;
  battement 45 s, « en ligne » < 90 s.
- Une ligne expirée ne déclenche aucune notification : l'expiration est calculée
  côté client à partir de `updated_at` / `last_seen_at`.
- Une panne Realtime ne bloque **jamais** l'envoi ou la lecture des messages.
- Ne jamais journaliser le contenu d'un message, même chiffré.

## 5. Chiffrement

- Le serveur ne voit que `ciphertext`, `iv`, `key_version`, `sender_key_id` et des
  clés enveloppées opaques.
- Les clés privées restent dans IndexedDB. Voir `messagerie-e2e.md`.
- Les réactions sont chiffrées comme les messages.
- Aucun contenu clair dans les logs, erreurs, analytics ou titres de page.

## 6. Reconnexion et trous

- Le client se reconnecte avec backoff + jitter, puis recharge l'historique par
  curseur (`before` / `after`).
- Déduplication par `id` ; un message optimiste et sa ligne live partagent le même `id`.
- Écouter `online` / `offline` et `visibilitychange`.

## 7. Tests exigés

- Un non-membre ne reçoit aucune ligne d'une conversation.
- Une requête scellée ne peut pas être rejouée pour une autre conversation.
- Message trop gros / trop fréquent → refus, connexion stable.
- `clientId` rejoué → une seule ligne.
- `typing` et `presence` expirent.
- Aucun secret dans le bundle client.

## 8. Interdits

- WebSocket en V1/V1.5.
- `apps/realtime` sans ADR.
- SQL ou paramètres fournis par le client.
- `userId` lu depuis un message client.
- Fichiers binaires sur le WebSocket.
- Stocker des SDP ou candidats ICE.
- Logger le contenu ou le secret Realtime.
