# Réseau — réseau social de l'apprentissage et de la preuve

Ce dossier contient la **configuration d'agents et la documentation** du projet, prêtes à copier à la racine du dépôt.

## Installation
1. Copier tout le contenu à la racine du dépôt Git (`CLAUDE.md`, `.claude/`, `docs/`, `render.yaml`, `CHANGELOG.md`, `.env.example`).
2. Installer `jq` (utilisé par les hooks) : `sudo apt install jq` ou `brew install jq`.
3. Créer les branches `main` et `dev`.
4. Remplacer les `CHANGE_ME` de `render.yaml` (dépôt, domaines) puis `render blueprints validate`.
5. Installer les skills externes : voir `docs/skills-to-install.md`.
6. Lancer Claude Code à la racine ; première commande : `/plan F01`.

## Ordre de construction V1 recommandé
F03 (profil, base) en parallèle de F01/F02 (auth) → F04 → F05 → F06 → F07 → F08 → F10 → F09.
(Détail de dépendances dans chaque fiche `docs/features/`.)

## Points à vérifier avant de coder
- Statut de Neon Auth et de Neon Storage dans la console (`docs/open-decisions.md` n° 11).
- Compatibilité Cloudflare ↔ bucket Neon (n° 12).
- Syntaxe de `render.yaml` (`render blueprints validate`).
- Commandes marquées « à vérifier » dans `docs/skills-to-install.md`.
