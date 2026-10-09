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
- Lot 1 — Auth (F01+F02) : SDK `@neondatabase/auth` isolé (`src/lib/auth.ts`),
  handler `/api/auth/[...path]`, `src/proxy.ts` (protégé par défaut + liste blanche
  des routes publiques), actions serveur (inscription, connexion, vérification,
  mot de passe oublié, déconnexion), validation Zod, anti-robot Turnstile vérifié
  côté serveur, 4 pages publiques `/sign-up`, `/verify-email`, `/sign-in`,
  `/forgot-password` (fiches UX `docs/ux/`).
- Lot 2 — Profil (F03+F04+F10) : onboarding `/onboarding/profile` (username unique vérifié
  en direct, identité) et `/me/profile` (édition + compétences). Couche domaine séparée
  (`src/lib/types.ts`, `src/lib/validation/profile.ts|skills.ts`, `src/lib/repositories/`,
  cas d'usage `src/lib/profile.ts` et `src/lib/skills.ts`) ; compétences normalisées par
  slug, plafond 30, autocomplétion trigramme, unicité garantie par contrainte. API REST
  `/api/me/profile` (GET/POST/PATCH), `/api/me/skills` (GET/POST),
  `/api/me/skills/{skillId}` (DELETE), `/api/skills` (GET),
  `/api/profiles/username-available` (GET), avec format d'erreur unique ; pages protégées
  renvoyées vers l'onboarding sans profil ; `/api/**` hors proxy (réponses JSON, 401).
  Composants `Textarea`, `TextareaField`, `Avatar`, `SkillBadge`, `SkillsField`,
  `UsernameField`. Fiches UX `docs/ux/onboarding-profile.md`, `docs/ux/profile-edit.md` ;
  catalogue `docs/api/rest.md`. **Avatar volontairement différé** (stockage F06 non
  tranché).
