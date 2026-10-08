# ADR 0006 — Accès à un espace : méthodes de vérification interchangeables

- **Statut** : accepté · **Date** : 2026-10-08

## Contexte
Toutes les universités n'ont pas d'e-mail institutionnel ; la vérification « étudiant » ne peut pas dépendre d'un seul mécanisme.

## Décision
Chaque espace configure une ou plusieurs **méthodes d'accès** (`email_domain`, `invite_code`, `invite_link`, `manual_approval`, `open`) via une interface `AccessMethod`. Le niveau de vérification est porté par l'**appartenance**, pas par le compte. Livré en V1.5 ; **aucune table en V1**.

## Alternatives écartées
Vérification par e-mail universitaire uniquement — exclut des établissements.

## Conséquences
Ajouter une méthode = une implémentation + une configuration, sans toucher aux cas d'usage existants. Détails : `docs/profiles-and-spaces.md`.
