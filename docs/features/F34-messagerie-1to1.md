# F34 — Messagerie chiffrée de bout en bout

- **Version** : V2 · **Dépend de** : F03 (profil) · **Statut** : 🟡 code livré, vérification à deux comptes en attente
- **Agents** : architecte, database, backend, frontend, designer, securite
- **ADR** : 0008 (Neon Realtime + Neon Functions)
- **Règles** : `.claude/rules/messagerie-e2e.md`, `.claude/rules/websocket.md`

## Objectif

Permettre à deux membres **vérifiés** d'échanger des messages privés en temps réel,
sans que le serveur puisse lire le contenu. Le fil, les réactions emoji et les accusés
de lecture sont chiffrés ou réduits au minimum de métadonnées.

## Périmètre V2

- Conversation **1 à 1** uniquement.
- **Demande de contact obligatoire** : aucune conversation n'existe avant acceptation.
- Texte + réactions emoji, **chiffrés côté client**. Un bouton emoji insère aussi
  un emoji **dans le texte**, au curseur.
- Fil pleine largeur ; la liste des conversations devient un **menu déroulant**
  accessible dans l'en-tête.
- Fil paginé par curseur, envoi optimiste.
- Accusés de lecture et de réception.
- Indicateur « en train d'écrire » et présence **best effort**.
- UI shadcn : `bubble`, `message`, `message-scroller`, `sidebar`, `skeleton`,
  `popover` (sélecteur de conversation).
- Sélecteur d'emoji : `emoji-picker-react` (5.1.4), utilisé aussi pour les
  commentaires.

## Hors périmètre

- Pièces jointes, images, audio, vidéo (V2.5).
- Groupes et espaces de discussion (schéma prévu, non exposé).
- Appels WebRTC (V3).
- Blocage, signalement et modération (backlog V2.5).
- Notifications push natives et e-mail.
- Multi-appareils et récupération de clé.

## Parcours

1. Depuis le sidebar, « Messages » ouvre `/messages`.
2. L'en-tête montre « Avec *Nom* ▾ » : le menu liste les conversations, les
   demandes de contact reçues (accepter / refuser) et les demandes envoyées.
3. Depuis un profil, « Message » ouvre une conversation existante. Sinon il envoie
   une **demande de contact** ; le bouton affiche « Demande envoyée ».
4. Le destinataire accepte : la conversation est créée et s'ouvre. Refusée, aucune
   conversation n'existe ; l'expéditeur peut renvoyer une demande (rate limit).
5. Un membre ouvre une conversation, lit l'historique paginé, écrit et envoie.
6. Le message apparaît immédiatement en optimiste, puis est remplacé par la ligne
   live (même `id`).
7. Le destinataire voit le message en direct ; l'accusé de lecture se met à jour.
8. Une réaction emoji s'ajoute ou se retire sur un message. Le bouton emoji du
   composer insère un emoji dans le texte, au curseur.

## Données

Voir `docs/data-model.md` § Tables V2 : `conversations`,
`conversation_participants`, `messages`, `message_reactions`, `message_receipts`,
`profile_keys`, `conversation_keys`, et `conversation_requests` (migration
`0013_v2_contact_requests.sql`, additive). Une demande ne stocke **aucun texte** :
expéditeur, destinataire, état (`pending` / `accepted` / `declined`), dates.

## API

### REST

| Route | Rôle |
|---|---|
| `POST /api/conversations` | Ouvrir une conversation **existante** ; `409` sinon |
| `GET /api/conversations` | Liste des conversations de la session |
| `GET /api/conversation-requests` | Demandes en attente (reçues / envoyées) |
| `POST /api/conversation-requests` | Envoyer une demande de contact (idempotent) |
| `POST /api/conversation-requests/:id/accept` | Accepter ; crée la conversation |
| `POST /api/conversation-requests/:id/decline` | Refuser la demande |
| `GET /api/conversations/:id/messages?cursor=` | Historique paginé (lignes chiffrées) |
| `POST /api/conversations/:id/messages` | Envoyer un message chiffré (idempotent `clientId`) |
| `PATCH /api/conversations/:id/read` | Mettre à jour le curseur de lecture |
| `PUT /api/messages/:id/reaction` | Ajouter/remplacer une réaction chiffrée |
| `DELETE /api/messages/:id/reaction` | Retirer sa réaction |
| `GET /api/keys/me` | Lire sa clé publique / son `keyId` |
| `POST /api/keys/me` | Publier sa clé publique (première configuration) |
| `GET /api/conversations/:id/keys` | Récupérer les clés de conversation enveloppées |

Toutes les routes exigent une session vérifiée et vérifient l'appartenance à la
conversation. L'identité vient de la session, jamais du corps. Le serveur ne crée
jamais une paire de son propre chef : seule l'acceptation d'une demande par le
destinataire crée la conversation.

### Live query

Une requête scellée par conversation (et une pour la liste) :

```sql
select id, conversation_id, sender_id, ciphertext, iv, key_version,
       sender_key_id, created_at, edited_at, deleted_at
from messages
where conversation_id = $1
  and exists (
    select 1 from conversation_participants p
    where p.conversation_id = messages.conversation_id
      and p.profile_id = $2
  )
order by created_at desc, id desc
limit 50
```

Le SQL réel est défini côté serveur, avec les paramètres liés. Le client reçoit une
capacité scellée ; il ne peut ni lire ni modifier la requête.

## Chiffrement

Voir `.claude/rules/messagerie-e2e.md`. Résumé :

- ECDH P-256 + HKDF-SHA-256 + AES-256-GCM via Web Crypto.
- Clé privée dans IndexedDB, non exportable ; clé publique envoyée au serveur.
- Clé de conversation aléatoire, enveloppée pour chaque participant ; le serveur
  stocke les enveloppes opaques.
- AAD = `conversationId | messageId | senderId | keyVersion`.
- Réactions chiffrées avec la même clé de conversation.
- Perte de la clé privée = historique illisible ; aucun recouvrement en V2.

## Saisie et présence

- Transport : **Neon Realtime** (deux requêtes scellées supplémentaires), pas de
  WebSocket maison ni de Neon Function.
- Saisie : `POST /api/conversations/[id]/typing` écrit `conversation_typing`
  (upsert), puis supprime la ligne quand la personne s'arrête. Le client envoie au
  plus un signal toutes les 2,5 s ; l'indicateur expire après 6 s côté client.
- Présence : `POST /api/presence` rafraîchit `profile_presence.last_seen_at` au
  montage puis toutes les 45 s (et au retour d'onglet). « En ligne » = moins de 90 s.
- Une panne du temps réel ne bloque **jamais** l'envoi : repli sur l'historique REST.
- Aucun polling de la liste : rafraîchissement sur focus, après une action, et par
  le fil temps réel.

## UI / UX

- `/messages` : **fil pleine largeur** (`max-w-3xl` centré) ; le sélecteur de
  conversation est un `Popover` dans l'en-tête (« Avec *Nom* ▾ »).
- Le menu contient la recherche, les demandes de contact (accepter / refuser), la
  liste des conversations avec extrait déchiffré et compteur non lu.
- Fil : `MessageScroller`, `Message`, `Bubble`, avatars, heure, état d'envoi.
- Composer : champ auto-redimensionné, bouton emoji (insertion **au curseur**),
  Entrée = envoyer, Maj+Entrée = nouvelle ligne.
- Réactions : pastilles sous la bulle, picker accessible distinct du composer.
- États : chargement (`Skeleton`), vide, erreur, reconnexion, clé absente,
  demande en attente.
- Indicateurs : pastille « En ligne / Vu il y a… » dans l'en-tête du fil, ligne
  « *Nom* écrit… » au-dessus du composer (`aria-live`).
- Tokens : `#7C3AED`, `#12A594`, `#F6F8FC`, `#10203F`, radius 14 px,
  motion 180 ms ease-out.

## Sécurité

- Aucun contenu clair ni clé privée dans les logs, erreurs, analytics ou base.
- `NEON_REALTIME_SECRET` serveur uniquement ; jamais dans le bundle.
- `NEXT_PUBLIC_NEON_REALTIME_URL` (même URL `wss://`) est la seule variable
  Realtime exposée au navigateur.
- Requêtes live filtrées par appartenance ; test d'accès croisé obligatoire.
- Rate limiting sur l'envoi et les réactions.
- Taille max d'un message : 16 Ko chiffré.
- Pas de `userId` client dans les payloads d'autorisation.
- Revue de l'agent `securite` avant fusion.

## Tests

- Crypto : round-trip, AAD falsifiée, IV réutilisé refusé, clé non exportable.
- API : non-membre → 403/404, message trop gros → 422, `clientId` rejoué → même ligne.
- Demandes : soi-même refusé, doublon idempotent, demande inverse signalée,
  non-destinataire → 404, double acceptation idempotente, refus puis nouvel envoi.
- Live query : un membre ne reçoit pas les messages d'une autre conversation.
- Réactions : une par personne, chiffrée, retrait idempotent.
- Saisie/présence : fenêtres 6 s / 90 s testées (`src/lib/realtime/signals.test.ts`),
  non-membre refusé sur les routes `typing` et `presence`.
- UI : envoi optimiste sans doublon, reconnexion sans trou, emoji inséré au curseur.
- Aucun secret dans le bundle client.

## Critères d'acceptation

- Deux comptes vérifiés échangent des messages en direct sur le dev Render.
- Une première prise de contact passe par une demande acceptée.
- Le contenu en base est chiffré ; une requête SQL directe ne révèle pas le texte,
  et `conversation_requests` ne contient aucun texte.
- Le serveur ne journalise jamais le contenu ni les clés.
- Tests, lint, typecheck et build passent.
- La fiche UX `docs/ux/messaging.md` est à jour.
