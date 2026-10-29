---
description: Frontend, expérience utilisateur, cohérence des pages
paths: ["src/app/**", "src/components/**", "src/modules/*/components/**"]
---
# Frontend et UX

0. **`DESIGN.md` d'abord** : référence UI/UX opposable. Détail des tokens et composants dans
   `.claude/rules/design-ui.md`.
1. **Fiche UX d'abord** (`docs/ux/<page>.md`) : utilisateur, parcours, états, mobile,
   accessibilité, textes. Pas de page sans fiche.
2. Composants de `src/components/ui` + composants maison listés dans `DESIGN.md` §6 ;
   tokens CSS (`bg-background`, `text-muted-foreground`…) ; **aucune couleur, taille ou
   espacement en dur**.
3. Mobile d'abord (360 px), cibles tactiles ≥ 44 px, pas de défilement horizontal.
4. Chaque page/liste gère : chargement (squelette), vide, erreur (avec « Réessayer »),
   succès, hors connexion.
5. Composants serveur par défaut ; `"use client"` seulement pour l'interactivité.
   Pas de données sensibles dans les props client.
6. Formulaires : Zod partagé côté client **et** serveur, erreurs sous le champ, bouton
   désactivé pendant l'envoi, saisie conservée en cas d'erreur.
7. Images : `next/image`, texte alternatif obligatoire, `sizes`, `lazy` sauf LCP.
   Pas de bibliothèque lourde sans justification (poids de page = coût des données).
8. Accessibilité : un seul `h1` par page, labels liés, focus visible, ordre clavier logique,
   contrastes AA, ne pas communiquer par la couleur seule.
9. Textes en français, tutoiement, courts et concrets.
10. Besoin d'un composant absent : le demander à `designer` (ajout à `DESIGN.md`), jamais de
    variante locale.
11. Avant de livrer : checklist `DESIGN.md` §13, test à 360 px et 1024 px, clavier seul,
    connexion lente simulée.
