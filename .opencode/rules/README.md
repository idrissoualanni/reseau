# Règles OpenCode

Ce dossier est le point d'entrée des règles lues par OpenCode. La source
autoritaire reste `.claude/rules/` (également importée par `CLAUDE.md`).

- `authentification.md` — parcours Neon Auth : envoi OTP, message neutre,
  bouton « œil », layout auth sans sidebar.
- Le reste : `.claude/rules/` (`api-rest.md`, `api-graphql.md`, `architecture.md`,
  `base-de-donnees.md`, `chiffrement-e2e.md`, `conventions.md`, `database.md`,
  `devops-render.md`, `donnees-personnelles.md`, `frontend-ux.md`, `git-workflow.md`,
  `hooks.md`, `nextjs.md`, `prompt-loop.md`, `securite`/`security.md`, `testing.md`,
  `webrtc.md`).

Une règle qui change se met à jour dans `.claude/rules/` puis est reprise ici si
elle concerne les agents OpenCode.
