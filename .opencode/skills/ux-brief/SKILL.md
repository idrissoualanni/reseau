---
description: Écrire la fiche UX d'une page (docs/ux) avant de coder tout écran. À utiliser pour chaque nouvelle page ou refonte d'écran.
name: ux-brief
---
# Fiche UX avant le code

1. Lire la fiche de fonctionnalité, `docs/design-system.md` et `.claude/rules/frontend-ux.md`.
2. Copier `docs/ux/_template.md` vers `docs/ux/<page>.md`.
3. Répondre dans l'ordre : *qui* vient ici, *pour faire quoi*, *l'action principale unique*, *d'où il vient / où il va*.
4. Décrire à **360 px d'abord** : hiérarchie du contenu, position de l'action principale, navigation.
5. Remplir le tableau des **états** (chargement, vide, erreur, succès, hors connexion). Aucune page sans ces cinq états.
6. N'utiliser que des composants du design system. Si un besoin manque : l'ajouter d'abord à `docs/design-system.md`.
7. Écrire les textes en français (titres, boutons, erreurs), courts, tutoiement.
8. Vérifier l'accessibilité : titres, labels, focus, contraste, alternatives textuelles.
9. Pour les pages d'une même famille (liste, détail, formulaire), réutiliser les mêmes gabarits pour garder la cohérence.
