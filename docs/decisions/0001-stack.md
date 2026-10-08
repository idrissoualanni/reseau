# ADR 0001 — Stack technique

- **Statut** : accepté · **Date** : 2026-10-08

## Contexte
Le cadrage initial prévoyait React + Vite + Supabase. Le projet est passé à une base Neon, un hébergement Render et un développement par agents de codage.

## Décision
Next.js (App Router, TypeScript) · Tailwind + shadcn/ui · Neon (Postgres, Auth, Storage) · Drizzle ORM · Zod · Vitest · pnpm (monorepo) · Render · Cloudflare.

## Alternatives écartées
Supabase (RLS, Realtime intégrés) — remplacé par Neon : les règles d'accès sont donc appliquées dans la couche `application`. React + Vite seul — pas de rendu serveur ni de route handlers.

## Conséquences
- Pas de Row Level Security par défaut : l'autorisation côté serveur est **obligatoire** (`rules/security.md`).
- Le temps réel (V2) demandera un service dédié (`apps/realtime`), pas fourni par la base.
