# VISION-V1 — Développer le réseau social : vision, toutes les pages, plan V1

> Source : `docs/vision.md`, `docs/roadmap.md`, `docs/phases.md`, fiches `F01–F10`,
> `docs/design-system.md`, `docs/data-model.md`, `docs/open-decisions.md`.
> État infra relevé via MCP Neon + MCP Render le 2026-10-09.

## 1. Vision V1

**Le profil se construit sur des preuves, pas sur des déclarations.** Le réseau social
modulable (cœur générique, premier profil : étudiant) fait V1 = **F01…F10** :

compte + vérification e-mail · profil · compétences normalisées · projets (texte + image)
· consultation · recherche par compétence. Pas d'espaces, pas de fil libre, pas de CV,
pas d'IA, pas de messagerie (V1.5+).

**Phase en cours** : 1 — Fondations. Critère de sortie : *un utilisateur peut s'inscrire,
publier, et voir son profil en production.*

## 2. État réel (constat au 2026-10-09)

- **Code** : fondations posées (Lot 0). Drizzle 0.45 + `drizzle-kit` 0.31, schéma V1
  (`src/db/schema.ts`) et migrations `drizzle/0000`–`0002`. Design system amorcé
  (tokens clair/sombre, composants UI de base, `PageShell`, navigation). `/api/health`
  opérationnel. Toujours absents : GraphQL, auth, pages métier (F01–F10).
- **Divergences docs ↔ dépendances installées** (à trancher avant de coder) :
  | Sujet | Docs disent | package.json réel |
  |---|---|---|
  | ORM | Drizzle | **Drizzle (décidé le 2026-10-09, Prisma retiré)** |
  | GraphQL | Yoga + Pothos | **@graphql-tools/schema** |
  | Structure | monorepo `apps/web` + `packages/*` | **racine unique** |
- **Infra (MCP)** : projet Neon `reseau` (us-east-2, PG18) avec branches `production`
  et `dev` ✅ · KV Render `reseau-dev` (frankfurt) ✅ · **aucun service Render
  `reseau-*`** → le blueprint `render.yaml` n'est pas appliqué.
- **Schéma DB** : aucune migration. Le modèle V1 cible est précisé dans
  `docs/data-model.md` (`profiles`, `skills`, `user_skills`, `projects`,
  `project_skills` + trigram/GIN).

## 3. Toutes les pages V1

### 3.1 Pages publiques (hors session)

| # | Route | Feature | Objectif / contenu | Fiche UX à écrire |
|---|---|---|---|---|
| 1 | `/sign-up` | F01 | Inscription e-mail + mot de passe + nom, Turnstile | `docs/ux/sign-up.md` |
| 2 | `/verify-email` | F01 | Saisie du code 6 chiffres, renvoi (1/min) | `docs/ux/verify-email.md` |
| 3 | `/sign-in` | F02 | Connexion + `next` (anti open-redirect) | `docs/ux/sign-in.md` |
| 4 | `/forgot-password` | F02 | E-mail → code → nouveau mot de passe | `docs/ux/forgot-password.md` |

### 3.2 Profil (session)

| # | Route | Feature | Objectif / contenu | Fiche UX |
|---|---|---|---|---|
| 5 | `/onboarding/profile` | F03 | Créer son profil (username unique, identité, avatar) | `onboarding-profile.md` |
| 6 | `/me/profile` | F10 + F04 | Éditer le profil + section compétences (autocomplétion, badges, max 30) | `profile-edit.md` |

### 3.3 Projets (session)

| # | Route | Feature | Objectif / contenu | Fiche UX |
|---|---|---|---|---|
| 7 | `/me/projects` | F05 | Liste de mes projets avec statut (brouillon/publié) | `project-editor.md` |
| 8 | `/me/projects/new` | F05 + F06 | Éditeur de création (titre, texte, compétences, couverture) | `project-editor.md` |
| 9 | `/me/projects/[id]/edit` | F05 + F06 | Modifier / publier / dépublier / supprimer | `project-editor.md` |

### 3.4 Découverte (session)

| # | Route | Feature | Objectif / contenu | Fiche UX |
|---|---|---|---|---|
| 10 | `/` | F07 | Fil des projets publiés (curseur, filtre compétence, « Voir plus ») | `projects-feed.md` |
| 11 | `/projects/[id]` | F07 | Détail projet (texte, image, auteur, compétences) | `project-detail.md` |
| 12 | `/u/[username]` | F08 | Profil public : identité, badges de preuve, projets publiés | `profile.md` |
| 13 | `/search` | F09 | Recherche par compétence (`?skill=`), suggestions proches | `search.md` |

### 3.5 Système (non visibles)

`/api/auth/[...path]` (Neon Auth) · `/api/graphql` (projets) · `/api/health` (santé Render)
· REST : `/api/me/profile`, `/api/skills`, `/api/me/skills`, `/api/search/students`,
`/api/profiles/{username}`, `/api/uploads/presign`.

### 3.6 Navigation et composants

- Nav : barre basse mobile (Projets · Recherche · Mon profil), barre haute desktop,
  menu avec déconnexion (`design-system.md` §6).
- Composants UI (shadcn/ui) : bouton, champ de formulaire, carte d'activité,
  navigation, avatar, pastille de compétence, empty/error/skeleton, toast.
- Composants maison obligatoires : `PageShell`, `EmptyState`, `ErrorState`,
  `ProjectCard`, `ProfileHeader`, `SkillBadge`, `ImageUploader`.
- Thème clair + sombre, mobile-first, contraste AA, cibles ≥ 44 px, « jamais d'écran
  blanc » (réseau lent).

## 4. Structure cible du code (racine unique — à trancher, voir §6)

```
src/db/{schema,client}.ts               # Drizzle : schéma V1 + client Neon (poolé, paresseux)
drizzle/                                # migrations Drizzle (0000 tables, 0001 trigram, 0002 index auteur)
src/app/(auth)/{sign-in,sign-up,verify-email,forgot-password}/
src/app/onboarding/profile/
src/app/(app)/{page,projects/[id],search,u/[username]}/
src/app/me/{profile,projects,projects/new,projects/[id]/edit}/
src/app/api/{auth/[...path],graphql,health,me/profile,me/skills,skills,search/students,uploads/presign}/
src/middleware.ts                     # auth.middleware
src/components/{ui/,PageShell,EmptyState,ErrorState,ProjectCard,ProfileHeader,SkillBadge,ImageUploader}
src/lib/{auth,storage,errors,zod}     # SDK isolés (Neon Auth/Storage, décision ouverte n°11)
src/server/graphql/                   # makeExecutableSchema (projets uniquement, ADR 0002)
src/server/*/application/             # cas d'usage métier (propriété vérifiée ici)
src/server/*/repositories/            # Drizzle (src/db/schema.ts)
tests/ + vitest.config                # unitaires (Zod, cas d'usage) + intégration DB
```

## 5. Plan de développement par lots

Chaque lot : branche dédiée, petits commits, `npm run lint` + `npm test` + `npm run build`
verts. Agents par lot : `database`, `backend`, `frontend`, `designer`, `qa`, `securite`.

| Lot | Contenu | Critère de sortie |
|---|---|---|
| **0 — Fondations** | Trancher les divergences (§6) · schéma Drizzle V1 + migrations sur branche Neon `dev` · `/api/health` · install shadcn/ui + tokens + thème · `PageShell`/nav | build+lint+tests verts, `/api/health` 200 en dev |
| **1 — Auth** | F01+F02 : handler Neon Auth, actions signUp/signIn/signOut, Turnstile, middleware, 4 pages publiques | parcours inscription → code → onboarding |
| **2 — Profil** | F03+F04+F10 : `profiles`, onboarding, `/me/profile`, compétences (autocomplétion, badges, max 30), upload avatar présigné | profil créé et éditable, badges `declared` |
| **3 — Projets** | F05+F06 : GraphQL (schéma, résolveurs, DataLoader), éditeur, publier/dépublier, recalcul des preuves, `ImageUploader` | brouillon publiable, `demonstrated` recalculé |
| **4 — Découverte** | F07+F08+F09 : fil (curseur), détail, profil public, recherche (tri preuve, suggestions trigramme) | parcours liste → détail → profil, < 300 ms sur 10 k profils |
| **5 — Déploiement V1** | branche git `dev` + `render.yaml` (`reseau-web-dev`), env vars Neon dev, sondes §2 d'AGENTS.md | inscrire → publier → voir son profil **en production** |

Ordre des fiches UX : 11 fiches (`docs/ux/`) à écrire **avant** chaque écran (règle
`ux-brief`) — toutes manquent sauf le template.

## 6. Décisions à trancher (bloquants avant Lot 0)

1. **Monorepo vs racine unique** : le défaut documenté est le monorepo npm workspaces ;
   l'échafaudage réel est racine unique. → trancher (recommandation : racine unique pour V1,
   migration monorepo non rentable avant V1.5).
2. **ORM** : Prisma 7 (installé) vs Drizzle (docs). → **RÉSOLU (2026-10-09) : Drizzle** — `drizzle-orm` 0.45 + `drizzle-kit` 0.31 + driver `@neondatabase/serverless`, schéma `src/db/schema.ts`, migrations `drizzle/`.
3. **GraphQL** : `@graphql-tools/schema` (installé) vs Yoga + Pothos (ADR 0002).
   → recommandation : conserver l'installé, ne relire l'ADR que s'il change la décision.
4. **Storage** : ADR 0004 (bucket privé/public, Cloudflare devant) — nécessaire pour F06.
5. **Suppression de compte** (décision ouverte n°10) : à planifier avant production.

## 7. Risques

- Divergences docs ↔ code non tranchées (bloquent le Lot 0).
- Aucun service Render « reseau » ni branche git `dev` : le déploiement (Lot 5) suppose
  ces créations + env vars (DATABASE_URL branche Neon `dev`, NEON_AUTH_*, Storage, Turnstile).
- Données : aucune migration appliquée ; le seed du référentiel de compétences (~100) est
  ouvert (décision n°3).
- Décisions ouvertes produit (nom, identité visuelle) : non bloquantes pour coder.

## Prochaine étape

1. Trancher §6 (3 premières décisions suffisent pour démarrer).
2. Démarrer le **Lot 0** sur une branche `foundations` avec les agents
   `database` (schéma Neon dev) puis `frontend` + `designer` (UI).