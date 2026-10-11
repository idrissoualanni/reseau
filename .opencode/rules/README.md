# Règles OpenCode

Ce dossier est le point d'entrée des règles lues par OpenCode. La source
autoritaire reste `.claude/rules/` (également importée par `CLAUDE.md`).

- `authentification.md` — parcours Neon Auth : envoi OTP, message neutre,
  bouton « œil », layout auth sans sidebar.
- `api-graphql.md` — GraphQL (Yoga + Pothos) : périmètre ADR 0002, scalars Pothos,
  limites de sécurité, DataLoaders (miroir de `.claude/rules/api-graphql.md`).
- `worktrees.md` — jonction node_modules via PowerShell, jamais `mklink /J` depuis
  Git Bash, jamais `npm install` dans un worktree jonctionné
  (miroir de `.claude/rules/worktrees.md`).
- `wip-utilisateur.md` — merger sur `dev` avec du WIP non commité : stash -u, merge,
  pop, ne jamais committer le WIP utilisateur (miroir de `.claude/rules/wip-utilisateur.md`).
- `testing.md` — Vitest (unitaires/intégration), tests d'intégration hors ligne, worktree
  neuf → `next typegen` avant `typecheck`, base réelle en opt-in sur la branche **dev**,
  traçabilité des fiches (miroir de `.claude/rules/testing.md`).
- Le reste : `.claude/rules/` (`api-rest.md`, `architecture.md`,
  `base-de-donnees.md`, `chiffrement-e2e.md`, `conventions.md`, `database.md`,
  `devops-render.md`, `donnees-personnelles.md`, `frontend-ux.md`, `git-workflow.md`,
  `hooks.md`, `nextjs.md`, `prompt-loop.md`, `securite`/`security.md`,
  `webrtc.md`).

Une règle qui change se met à jour dans `.claude/rules/` puis est reprise ici si
elle concerne les agents OpenCode.
