# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · Versionnage : [SemVer](https://semver.org/lang/fr/) · Commits : Conventional Commits.
Mis à jour par `/changelog` à chaque fusion `dev` → `main`.

## [Non publié]
### Ajouté
- Cadrage du projet, documentation et configuration `.claude/`.
- Lot 0 — Fondations UI : tokens clair/sombre (accent violet), composants de base
  (`Button`, `Input`, `Label`, `Card`, `Badge`, `Skeleton`), composants maison
  (`PageShell`, `EmptyState`, `ErrorState`), navigation haut (desktop) / bas (mobile),
  thème commutable via `next-themes`.
- Sonde `GET /api/health` (statut `ok`/`degraded` selon la base) et
  `checkDatabase()` dans `src/db/client.ts`.
