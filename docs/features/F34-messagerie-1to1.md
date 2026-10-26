# F34 — Messagerie chiffrée de bout en bout

- **Version** : V2 · **Dépend de** : F03 (profil) · **Statut** : 🔜 à développer
- **Agents** : architecte, database, backend, frontend, designer, securite
- **ADR** : 0008 (Neon Realtime + Neon Functions)
- **Règles** : `.claude/rules/messagerie-e2e.md`, `.claude/rules/websocket.md`

## Objectif

Permettre à deux membres **vérifiés** d'échanger des messages privés en temps réel,
sans que le serveur puisse lire le contenu. Le fil, les réactions emoji et les accusés
de lecture sont chiffrés ou réduits au minimum de métadonnées.

## Périmètre V2

- Conversation **1 à 1** uniquement.
- Texte + réactions emoji, **chiffrés côté client**.
- Liste des conversations, fil paginé par curseur, envoi optimiste.
- Accusés de lecture et de réception.
- Indicateur « en train d'écrire » et présence **best effort**.
- UI shadcn : `bubble`, `message`, `message-scroller`, `sidebar`, `skeleton`.
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
2. La liste affiche les conversations triées par dernier message, avec un extrait
   déchiffré localement et le compteur non lu.
3. Un membre ouvre une conversation, lit l'historique paginé, écrit et envoie.
4. Le message apparaît immédiatement en optimiste, puis est remplacé par la ligne
   live (même `id`).
5. Le destinataire voit le message en direct ; l'accusé de lecture se met à jour.
6. Une réaction emoji s'ajoute ou se retire sur un message.

## Données

Voir `docs/data-model.md` § Tables V2 : `conversations`,
`conversation_participants`, `messages`, `message_reactions`, `message_receipts`,
`profile_keys`, `conversation_keys`. Migration **additive**.

## API

### REST

| Route | Rôle |
|---|---|
| `POST /api/conversations` | Créer ou retrouver une conversation directe (`directKey`) |
| `GET /api/conversations` | Liste des conversations de la session |
| `GET /api/conversations/:id/messages?cursor=` | Historique paginé (lignes chiffrées) |
| `POST /api/conversations/:id/messages` | Envoyer un message chiffré (idempotent `clientId`) |
| `PATCH /api/conversations/:id/read` | Mettre à jour le curseur de lecture |
| `PUT /api/messages/:id/reaction` | Ajouter/remplacer une réaction chiffrée |
| `DELETE /api/messages/:id/reaction` | Retirer sa réaction |
| `GET /api/keys/me` | Lire sa clé publique / son `keyId` |
| `POST /api/keys/me` | Publier sa clé publique (première configuration) |
| `GET /api/conversations/:id/keys` | Récupérer les clés de conversation enveloppées |

Toutes les routes exigent une session vérifiée et vérifient l'appartenance à la
conversation. L'identité vient de la session, jamais du corps.

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

- Neon Function WebSocket, jeton court signé par Next.js.
- `typing.start` / `typing.stop` : TTL 5 s, jamais persistés.
- `presence.update` : état par conversation, TTL 30 s, best effort.
- Limites : 10 événements/s/utilisateur, payload ≤ 1 Ko.
- Une fonction absente ou en erreur ne bloque **jamais** l'envoi de messages.

## UI / UX

- `/messages` : layout deux panneaux (liste + fil), responsive mobile.
- Fil : `MessageScroller`, `Message`, `Bubble`, avatars, heure, état d'envoi.
- Composer : champ auto-redimensionné, bouton emoji, Entrée = envoyer,
  Maj+Entrée = nouvelle ligne.
- Réactions : pastilles sous la bulle, picker accessible.
- États : chargement (`Skeleton`), vide, erreur, reconnexion, clé absente.
- Tokens : `#2F66DB`, `#12A594`, `#F6F8FC`, `#10203F`, radius 14 px,
  motion 180 ms ease-out.

## Sécurité

- Aucun contenu clair ni clé privée dans les logs, erreurs, analytics ou base.
- `NEON_REALTIME_SECRET` serveur uniquement ; jamais dans le bundle.
- Requêtes live filtrées par appartenance ; test d'accès croisé obligatoire.
- Rate limiting sur l'envoi et les réactions.
- Taille max d'un message : 16 Ko chiffré.
- Pas de `userId` client dans les payloads d'autorisation.
- Revue de l'agent `securite` avant fusion.

## Tests

- Crypto : round-trip, AAD falsifiée, IV réutilisé refusé, clé non exportable.
- API : non-membre → 403/404, message trop gros → 422, `clientId` rejoué → même ligne.
- Live query : un membre ne reçoit pas les messages d'une autre conversation.
- Réactions : une par personne, chiffrée, retrait idempotent.
- Saisie/présence : expiration TTL, jeton invalide refusé.
- UI : envoi optimiste sans doublon, reconnexion sans trou.
- Aucun secret dans le bundle client.

## Critères d'acceptation

- Deux comptes vérifiés échangent des messages en direct sur le dev Render.
- Le contenu en base est chiffré ; une requête SQL directe ne révèle pas le texte.
- Le serveur ne journalise jamais le contenu ni les clés.
- Tests, lint, typecheck et build passent.
- La fiche UX `docs/ux/messaging.md` est écrite avant le code UI.
