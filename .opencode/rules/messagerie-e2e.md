---
description: Miroir OpenCode de `.claude/rules/messagerie-e2e.md` — chiffrement E2E V2.
---
# Messagerie E2E (miroir)

- ECDH P-256 + HKDF-SHA-256 + AES-256-GCM via Web Crypto ; aucune crypto maison.
- Clé privée **non exportable** dans IndexedDB ; clé publique seule côté serveur.
- Clé de conversation aléatoire, enveloppée par participant ; serveur = enveloppes opaques.
- AAD lie `conversationId`, `messageId`, `senderId`, `keyVersion`.
- IV 12 octets aléatoire, jamais réutilisé.
- Réactions chiffrées comme les messages.
- Aucun clair, aucune clé, aucun ciphertext dans les logs.
- Perte de la clé privée = historique illisible ; aucun recouvrement en V2.
- Demande de contact : aucun texte stocké ; conversation créée seulement par
  acceptation du destinataire (`409` sinon). Non-destinataire → `404`.
- Revue `securite` obligatoire avant fusion.

Détails : `.claude/rules/messagerie-e2e.md`.
