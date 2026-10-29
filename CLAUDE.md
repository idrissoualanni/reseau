@AGENTS.md

# Réseau — mémoire du projet (CLAUDE.md)

Réseau social où **le profil se construit sur des preuves** (projets publiés, compétences), pas sur des déclarations.
Premier public : étudiants. Le réseau doit rester **modulable** (d'autres profils viendront). Vision complète : `docs/vision.md`.

## Statut
- **V1 (en cours)** : fonctionnalités minimales F01–F10 (`docs/features/`). Rien d'autre n'est à construire.
- **V1.5** : fil libre + vidéo, publications structurées, espaces/universités, CV et portfolio modifiables.
- **V2** : messagerie chiffrée + appels WebRTC. **V3** : recruteurs, universités (tableau de bord), entrepreneurs, communauté ouverte.
- Feuille de route : `docs/roadmap.md`. **Ne jamais construire une fonctionnalité d'une version future.**

## Langues
- Interface utilisateur et `docs/` : **français**. Code, noms de variables, commits, branches : **anglais**.

## Stack (ne pas en changer sans ADR dans `docs/decisions/`)
Next.js (App Router, TypeScript strict) · Tailwind + shadcn/ui · Neon (Postgres, **Neon Auth**, **Neon Storage**) · Drizzle ORM + drizzle-kit ·
GraphQL (Yoga + Pothos) **uniquement pour les projets/posts**, REST (route handlers) pour tout le reste · Zod · Vitest + Vitest UI · npm · Render (dev puis production) · Cloudflare (DNS, CDN, WAF, Turnstile).

## Structure du dépôt (monorepo npm)
```
apps/web/            Next.js (UI + GraphQL + REST)        ← V1
apps/realtime/       WebSocket (messagerie, signalisation) ← V2, ne pas créer avant
packages/db/         schéma Drizzle, migrations, client
packages/shared/     schémas Zod, types, constantes (contrats partagés)
docs/  .claude/  render.yaml  CHANGELOG.md
```
Architecture en couches dans chaque module : voir `.claude/rules/architecture.md`.

## Commandes
`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run test:ui` (Vitest UI) ·
`npm run db:generate` · `npm run db:migrate` · `npm run db:studio`
Commandes slash : `/brainstorm` `/plan` `/build` `/new-feature` `/change-feature` `/test` `/db-migrate` `/changelog` `/deploy-dev` `/release`.

## Règles non négociables
1. **Spec → plan validé → code.** Pas de code sans fiche `docs/features/Fxx-*.md` ni plan approuvé (`docs/plans/`).
2. **Une tâche = un worktree = une branche** `feat/Fxx-slug` ; PR vers `dev` ; jamais de commit direct sur `dev` ni `main`.
3. **Couches** : `app (transport)` → `application (cas d'usage)` → `data (Drizzle)`. Aucune requête SQL hors de `data/`. Aucune règle métier hors de `application/`.
4. **Autorisation côté serveur**, dans la couche `application`, à chaque cas d'usage. Jamais seulement dans l'UI.
5. **Zod** valide toute entrée (REST, GraphQL, formulaires). Schémas dans `packages/shared`.
6. **Migrations versionnées** Drizzle, jamais de modification manuelle de la base. Style *expand puis contract*.
7. **Pas de secret dans le code.** `.env*` interdit en lecture/écriture ; variables par environnement Render.
8. **Mobile d'abord**, pages légères, tous les états gérés (chargement, vide, erreur). Fiche UX avant toute page (`docs/ux/`).
9. **Définition de « terminé »** : types OK, lint OK, tests Vitest verts, critères d'acceptation de la fiche cochés, doc + CHANGELOG à jour, validé sur `dev`.
10. **Données personnelles** : minimiser, ne rien logger de personnel, respecter la loi sénégalaise (`docs/risks.md`).

## Où lire quoi
| Besoin | Fichier |
|---|---|
| Acteurs, profils, espaces | `docs/actors.md`, `docs/profiles-and-spaces.md` |
| Preuves de compétence | `docs/proof-model.md` |
| Architecture, déploiement | `docs/architecture.md`, `docs/environments-and-deploy.md` |
| Base de données, index | `docs/data-model.md` |
| Procédure des agents | `docs/workflow.md` |
| Principes d'ingénierie | `docs/engineering-principles.md` |
| **UI / design (référence opposable)** | `DESIGN.md` puis `docs/design-system.md` |
| Skills à installer | `docs/skills-to-install.md` |
| Décisions ouvertes | `docs/open-decisions.md` |

## Agents (`.claude/agents/`)
architect · database · backend · frontend · designer · qa · security · devops · docs — chacun possède des dossiers précis (`docs/workflow.md`, section « Propriété des fichiers »).
