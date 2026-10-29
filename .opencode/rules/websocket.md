---
description: Miroir OpenCode de `.claude/rules/websocket.md` — temps réel V2.
---
# Temps réel V2 (miroir)

- **Neon Realtime** pour les lignes persistées (messages, réactions, accusés, liste).
- **Neon Realtime** aussi pour les signaux courts : `conversation_typing` et
  `profile_presence`, expirés côté client (6 s / 90 s), sans polling.
- `apps/realtime` n'est pas créé ; un service dédié exigerait un ADR.
- Écritures uniquement par REST Next.js : valider → autoriser → persister.
- Live queries définies et **scellées** côté serveur, filtrées sur l'appartenance.
- `NEON_REALTIME_SECRET` serveur uniquement ; jamais dans le bundle ou les logs.
- Seule variable navigateur : `NEXT_PUBLIC_NEON_REALTIME_URL`.
- Aucun contenu clair, aucune clé privée côté serveur.
- Tests d'accès croisé et de non-membre obligatoires.

Détails : `.claude/rules/websocket.md`.
