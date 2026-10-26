# ADR 0008 — Temps réel V2 : Neon Realtime + Neon Functions

- **Statut** : accepté · **Date** : 2026-10-26
- **Remplace** : l'architecture temps réel prévue par l'ADR 0005 (`apps/realtime` séparé).

## Contexte

L'ADR 0005 prévoyait un service Node `apps/realtime` (WebSocket) pour la messagerie,
la présence et la signalisation des appels. La V2 démarre par la messagerie 1 à 1.
Un service supplémentaire impose un déploiement Render, une authentification de
ticket, un bus Redis pour plusieurs instances et une supervision dédiée.

Neon fournit deux briques adaptées :

- **Neon Realtime (beta)** : rend une requête SQL live. Une requête scellée côté
  serveur est souscrite par le client ; chaque changement de ligne est poussé.
- **Neon Functions** : fonctions HTTP longues, avec WebSocket, exécutées près de la
  base. Adaptées aux événements éphémères qui ne viennent pas d'une ligne.

## Décision

### Messages et état persistant

Les messages, réactions et accusés de lecture sont des **lignes Postgres**. Le client
les lit avec une **live query Neon Realtime** scellée côté serveur. Les écritures
passent par l'API Next.js (REST ou GraphQL), qui valide, autorise et persiste le
contenu chiffré. Le serveur ne déchiffre jamais.

```text
Navigateur ──POST /api/conversations/:id/messages──► Next.js (auth + validation)
     │                                                     │
     │                                                     ▼
     │                                              Postgres (Neon)
     │                                                     │
     └──◄── live query scellée (Neon Realtime) ◄────────────┘
```

### Événements éphémères

`typing.start`, `typing.stop` et `presence.update` passent par une **Neon Function
WebSocket**. Ces événements ne sont jamais persistés et expirent après quelques
secondes. L'authentification utilise un jeton court signé par Next.js, jamais un
`userId` fourni par le client.

La signalisation WebRTC (offers, answers, ICE) reste **hors V2** et fera l'objet
d'une décision séparée. Elle pourra réutiliser la même Function ou un service dédié.

### Périmètre V2

- Messagerie **1 à 1** uniquement ; le schéma prévoit les groupes sans les exposer.
- Texte + réactions emoji, **chiffrés de bout en bout**.
- Indicateur de saisie et présence via Neon Functions.
- Accusés de lecture et liste de conversations live.
- Pas de pièce jointe, d'appel, de message de groupe ni de notification push native.
- Éligibilité MVP : deux profils **vérifiés** peuvent se contacter. Le blocage et le
  signalement restent au backlog.

### Autorisation des live queries

- Une requête scellée est créée **par requête authentifiée**, avec l'identité issue
  de la session serveur.
- Le SQL filtre explicitement les conversations dont l'utilisateur est membre.
- Le client ne peut ni lire le SQL, ni changer les paramètres, ni en créer une.
- `NEON_REALTIME_SECRET` reste **serveur uniquement** ; il n'est jamais préfixé
  `NEXT_PUBLIC_`.
- Le renouvellement des requêtes scellées est géré côté serveur.

### Chiffrement

Le protocole E2E est décrit dans `.claude/rules/messagerie-e2e.md`. Le serveur stocke
uniquement des enveloppes opaques (`ciphertext`, `iv`, `key_version`, clés publiques
et clés de conversation enveloppées). Les clés privées restent dans IndexedDB.

## Conséquences

### Positives

- Aucun service Render supplémentaire ni bus Redis pour la V2.
- Les messages sont des lignes normales : index, pagination, migrations et sauvegardes
  habituelles.
- Les requêtes live sont autorisées par le serveur, pas par une confiance au client.
- Le temps réel et la persistance restent dans Neon, au plus près de la base.

### Négatives / risques

- Neon Realtime est en **beta** : API susceptible de changer ; versionner les paquets.
- `NEON_REALTIME_SECRET` donne le droit de sceller n'importe quelle requête : le
  traiter comme `DATABASE_URL`, le faire tourner en cas de fuite.
- Neon Functions a des démarrages à froid et des limites de connexion à surveiller.
- La présence est **best effort** : un onglet fermé brutalement laisse un état qui
  expire par TTL.
- Une perte de la clé privée client rend l'historique illisible ; aucun recouvrement
  n'est prévu en V2.

## Alternatives écartées

| Alternative | Raison |
|---|---|
| `apps/realtime` Node + `ws` | Service, tickets, Redis et supervision supplémentaires pour un besoin couvert. |
| Ably / Pusher | Coût et fournisseur en plus ; la persistance resterait chez Neon. |
| Polling HTTP | Latence et charge ; ne répond pas au besoin « live ». |
| Supabase Realtime | Introduit un second fournisseur de base. |

## Vérification

- Realtime activé sur la branche `dev` ; origines autorisées : `http://localhost:3000`
  et `https://reseau-3tuk.onrender.com`.
- Preuve du 2026-10-26 : abonnement à une table de test, snapshot vide, insertion,
  réception de la ligne, puis suppression de la table.
- Le secret n'apparaît ni dans le bundle client ni dans les logs.
