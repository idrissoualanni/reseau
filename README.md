# Réseau — réseau social de l'apprentissage et de la preuve

Projet Next.js · GraphQL · Neon (Postgres) · Render · WebRTC · chiffrement de bout en bout.
Premier profil ciblé : étudiant ; le cœur reste générique (docs/architecture.md).

## Démarrage (dev)

```bash
npm install
npm run dev
```

Tests : `npm test` · Lint : `npm run lint` · Build : `npm run build`.

## Documentation

- `CLAUDE.md` — mémoire du projet (règles, stack, workflow git).
- `docs/` — architecture, base de données, vision, roadmap, phases, features (F01–F10).
- `.claude/rules/` — règles détaillées par domaine (GraphQL, E2E, WebRTC, profils).
- `docs/skills-to-install.md` — skills externes requis.

## Ordre de construction V1 recommandé
F03 (profil, base) en parallèle de F01/F02 (auth) → F04 → F05 → F06 → F07 → F08 → F10 → F09.
(Détail de dépendances dans chaque fiche `docs/features/`.)

## Points à vérifier avant de coder
- Statut de Neon Auth et de Neon Storage dans la console (`docs/open-decisions.md` n° 11).
- Compatibilité Cloudflare ↔ bucket Neon (n° 12).
- Syntaxe de `render.yaml` (`render blueprints validate`).
- Commandes marquées « à vérifier » dans `docs/skills-to-install.md`.