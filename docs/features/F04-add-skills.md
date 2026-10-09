# F04 — Ajouter ses compétences

- **Version** : V1 · **Dépend de** : F03 · **Agents** : database, backend, frontend, qa
- **Objectif** : déclarer les compétences d'un profil avec un référentiel normalisé.
- **User story** : En tant que membre, je veux ajouter mes compétences, afin qu'on puisse me trouver.

## Règles métier
1. Ajout par saisie avec **autocomplétion** sur le référentiel (`skills`). Si la compétence n'existe pas, elle est **créée** (création libre normalisée).
2. Normalisation : `slug` = minuscules, sans accents, espaces → `-`, caractères `[a-z0-9-+#.]` ; `name` conserve la casse saisie nettoyée. Dédoublonnage par `slug`.
3. Maximum **30** compétences par profil ; pas de doublon.
4. Niveau initial : `declared`. Il passe à `demonstrated` automatiquement quand un projet **publié** du membre porte cette compétence (`proof-model.md`).
5. Suppression d'une compétence possible à tout moment (n'efface pas le référentiel).
6. Seul le propriétaire modifie ses compétences.

## Écrans / routes
Section « Compétences » dans `/me/profile` (et pendant l'onboarding, étape facultative). Affichage avec badge de niveau.

## API
REST : `GET /api/skills?q=react&limit=8` (autocomplétion, exact puis trigramme) · `POST /api/me/skills` `{ name }` → `201` · `DELETE /api/me/skills/{skillId}` → `204` · `GET /api/me/skills`.

## Données
`skills`, `user_skills` (index `skills_slug_uq`, `skills_name_trgm`).

## Validation (Zod)
`name` 2–40 car., au moins une lettre ou un chiffre, pas de HTML. `q` 1–40.

## Erreurs
| Cas | Code | Message |
|---|---|---|
| Déjà ajoutée | CONFLICT | « Tu as déjà cette compétence. » |
| Limite atteinte | VALIDATION | « Tu peux ajouter jusqu'à 30 compétences. » |
| Nom invalide | VALIDATION | « Nom de compétence invalide. » |

## Critères d'acceptation
- [x] En tapant « reac », « React » est proposé.
- [x] Ajouter « Réact » et « react » ne crée qu'une seule compétence (même slug).
- [x] Impossible d'ajouter une 31ᵉ compétence.
- [ ] Une compétence liée à un projet publié affiche le badge `demonstrated`. *Reporté : les projets arrivent au Lot 3 (F05/F06) ; la dérivation du niveau sera branchée à ce moment.*
- [x] Un membre ne peut pas modifier les compétences d'un autre. *Structurel : `profile_id` vient de la session, jamais du corps.*

## Tests attendus
Unitaires : normalisation du slug, limite, dérivation du niveau. Intégration : unicité du slug. E2E : ajout/suppression.

## Hors périmètre
Niveaux manuels (maître/débutant), hiérarchie/catégories de compétences, suggestions IA, validation par autrui (supprimée du produit).
