---
name: feature-spec
description: Écrire ou mettre à jour la fiche d'une fonctionnalité (docs/features/Fxx). À utiliser avant tout plan ou code, pour toute nouvelle fonctionnalité ou évolution.
---
# Écrire une fiche de fonctionnalité

1. Lire `docs/roadmap.md` : la fonctionnalité est-elle dans la version en cours ? Sinon, la ranger dans la roadmap et s'arrêter.
2. Copier `docs/features/_template.md` vers `docs/features/Fxx-slug.md` (numéro suivant).
3. Remplir chaque section. Règles d'écriture :
   - Règles métier **numérotées et testables** (« Maximum 30 compétences », pas « un nombre raisonnable »).
   - Erreurs : tableau cas → code → message français.
   - Critères d'acceptation : « Given/When/Then » courts, un par comportement, tous vérifiables.
   - **Hors périmètre** explicite : ce que les gens voudront ajouter, et qu'on refuse maintenant.
4. Vérifier la cohérence : tables/colonnes citées existent dans `docs/data-model.md` pour cette version ; l'API respecte `rules/api-*.md`.
5. Lister les questions ouvertes à la fin ; ne pas les trancher seul.
