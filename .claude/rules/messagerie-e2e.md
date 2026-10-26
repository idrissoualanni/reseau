---
description: Chiffrement de bout en bout de la messagerie V2 — clés, enveloppes, réactions, stockage local.
paths:
  - src/modules/messaging/**
  - src/lib/crypto/**
  - src/app/api/conversations/**
  - src/app/api/keys/**
---

# Règle — messagerie E2E

## 1. Principe

Le serveur ne doit **jamais** pouvoir lire un message, une réaction ou une clé privée.
Il stocke des enveloppes opaques, les clés publiques et les métadonnées minimales.

## 2. Algorithmes

- Échange de clés : **ECDH P-256** (Web Crypto).
- Dérivation : **HKDF-SHA-256**.
- Chiffrement : **AES-256-GCM**, IV 12 octets aléatoire par message.
- AAD : `conversationId | messageId | senderId | keyVersion`.
- Ne jamais implémenter sa propre courbe, son propre KDF ou son propre mode.
- Utiliser `crypto.subtle` ; pas de bibliothèque non auditée.

## 3. Clés

- À la première utilisation, le client génère une paire ECDH P-256.
  - clé publique : exportable, envoyée au serveur (`profile_keys`) ;
  - clé privée : **non exportable**, stockée dans IndexedDB.
- Un appareil par compte en V2. Aucun recouvrement, aucune sauvegarde serveur.
- Perte d'IndexedDB = historique illisible. L'UI doit l'expliquer avant activation.
- Une rotation de clé est explicite et invalide l'historique ancien ; pas de rotation
  silencieuse.
- Le serveur ne stocke que `public_key_jwk`, `key_id`, `algorithm`, jamais la privée.

## 4. Clé de conversation

- Une clé AES-256 aléatoire par conversation (`conversationKey`).
- Elle est enveloppée pour chaque participant avec une KEK dérivée ECDH + HKDF.
- Le serveur stocke `wrapped_key`, `iv`, `algorithm`, `key_version` — opaques.
- Un nouveau participant reçoit la clé enveloppée ; l'historique n'est pas réécrit.
- Le client vérifie que la clé enveloppée correspond à `conversationId` et `keyId`.

## 5. Messages

- `ciphertext` = base64(AES-GCM(plaintext)).
- `iv` = base64(12 octets aléatoires), jamais réutilisé avec la même clé.
- `key_version` et `sender_key_id` accompagnent chaque message.
- Taille maximale du clair : 8 Ko ; ciphertext ≤ 16 Ko.
- Édition : nouveau `iv`, nouveau ciphertext, `edited_at` ; ne pas réutiliser l'IV.
- Suppression : `deleted_at` ; le ciphertext peut rester (historique) ou être purgé,
  selon la politique de rétention à valider.

## 6. Réactions

- Le payload de réaction (emoji + éventuellement libellé) est **chiffré**.
- La table ne contient que `ciphertext`, `iv`, `key_version`, `profile_id`,
  `message_id`, `created_at`.
- Une seule réaction par personne et par message ; toggle côté client.

## 7. Stockage local

- IndexedDB : clé privée (`CryptoKey`), `keyId`, clés de conversation déchiffrées.
- Jamais dans `localStorage`, un cookie, un log ou un état React sérialisé.
- Effacer à la déconnexion ? Non par défaut (sinon historique perdu) ; proposer
  « oublier cet appareil » avec confirmation.
- Aucun export de clé privée.

## 8. Métadonnées

- Stocker le minimum : participants, dates, tailles, `key_version`.
- Pas d'index plein texte, pas de recherche serveur sur le contenu.
- Les titres de conversation ne contiennent pas de contenu de message.
- Les logs ne contiennent ni ciphertext ni clé.

## 9. Revue obligatoire

- Toute modification de ce domaine passe par l'agent `securite` avant fusion.
- Tests : round-trip, AAD falsifiée, IV réutilisé refusé, clé non exportable,
  non-membre refusé, bundle sans secret.
- En cas de doute sur un point cryptographique : s'arrêter et poser la question.
