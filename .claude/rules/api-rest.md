---
description: Route handlers REST
paths: ["apps/web/src/app/api/**"]
---
# REST

- Route handlers dans `app/api/**/route.ts`. Un handler : (1) lire la session, (2) valider l'entrée avec Zod, (3) appeler **un** cas d'usage, (4) formater la réponse. Rien d'autre.
- Ressources : `/api/me/profile`, `/api/me/skills`, `/api/skills`, `/api/profiles/{username}`, `/api/search/students`, `/api/uploads/presign`, `/api/health`.
- Verbes : GET lecture · POST création · PATCH modification partielle · DELETE suppression. Codes : 200, 201, 204, 400, 401, 403, 404, 409, 422, 429.
- Format d'erreur unique : `{ "error": { "code": "VALIDATION", "message": "…", "fields": { "bio": "Trop long" } } }`. Jamais de stack trace.
- Les schémas Zod en `.strict()` rejettent les champs inconnus (protège `user_id`, `username` immuable…).
- Listes : pagination par curseur (`cursor`, `limit` ≤ 50) → `{ items, nextCursor }`.
- Réponses sans données privées (e-mail, `user_id`) via des fonctions de **mapping de sortie** testées.
- Pas de cache sur les routes authentifiées ; `Cache-Control: no-store` par défaut.
