---
description: Miroir OpenCode de `.claude/rules/websocket.md` — temps réel V2.
---
# Temps réel V2 (miroir)

- **Neon Realtime** pour les lignes persistées (messages, réactions, accusés, liste).
- **Neon Functions WebSocket** pour l'éphémère (saisie, présence), TTL court, non persisté.
- `apps/realtime` n'est pas créé ; un service dédié exigerait un ADR.
- Écritures uniquement par REST Next.js : valider → autoriser → persister.
- Live queries définies et **scellées** côté serveur, filtrées sur l'appartenance.
- `NEON_REALTIME_SECRET` serveur uniquement ; jamais dans le bundle ou les logs.
- Aucun contenu clair, aucune clé privée côté serveur.
- Tests d'accès croisé et de non-membre obligatoires.

Détails : `.claude/rules/websocket.md`.
