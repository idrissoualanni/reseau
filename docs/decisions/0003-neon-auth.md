# ADR 0003 — Neon Auth pour l'authentification

- **Statut** : accepté (avec réserve) · **Date** : 2026-10-08

## Contexte
Neon Auth (basé sur Better Auth) fournit inscription, sessions et envoi d'e-mails sans service mail propre. Il est indiqué comme **bêta** dans la documentation.

## Décision
Utiliser Neon Auth via `@neondatabase/auth` (handler Next.js, middleware). Vérification d'e-mail par **code** (le SMTP partagé le supporte ; les liens exigent un SMTP personnalisé). Tout accès au SDK passe par `apps/web/src/lib/auth.ts`.

## Alternatives écartées
Better Auth / Auth.js autonomes — plus de configuration et un service mail à gérer.

## Conséquences
- Un changement de fournisseur reste localisé à `lib/auth.ts`.
- Les comptes vivent hors de nos tables : `profiles.user_id` en référence logique (vérifier la possibilité d'une clé étrangère inter-schéma).
- À réévaluer à la sortie de bêta ; surveiller les changements de version du SDK (épingler).
