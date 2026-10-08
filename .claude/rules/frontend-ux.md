---
description: Frontend, expérience utilisateur, cohérence des pages
paths: ["apps/web/src/app/**", "apps/web/src/components/**", "apps/web/src/modules/*/components/**"]
---
# Frontend et UX

1. **Fiche UX d'abord** (`docs/ux/<page>.md`) : utilisateur, parcours, états, mobile, accessibilité. Pas de page sans fiche.
2. Lire `docs/design-system.md`. **Uniquement** des composants de `components/ui` + composants maison listés ; tokens CSS (`bg-background`, `text-muted-foreground`…) ; **aucune couleur, taille ou espacement en dur**.
3. Mobile d'abord (360 px), cibles tactiles ≥ 44 px, pas de défilement horizontal.
4. Chaque page/liste gère : chargement (squelette), vide, erreur (avec « Réessayer »), succès, hors connexion.
5. Composants serveur par défaut ; `"use client"` seulement pour l'interactivité (formulaires, autocomplétion, upload). Pas de données sensibles dans les props client.
6. Formulaires : Zod partagé côté client **et** serveur, erreurs sous le champ, bouton désactivé pendant l'envoi, saisie conservée en cas d'erreur.
7. Images : `next/image`, texte alternatif obligatoire, `lazy`. Pas de bibliothèque lourde sans justification (poids de page = coût des données).
8. Accessibilité : un seul `h1` par page, labels liés, focus visible, ordre clavier logique, contrastes AA, ne pas communiquer par la couleur seule.
9. Textes en français, tutoiement, courts et concrets.
10. Besoin d'un composant absent : le demander à `designer` (ajout au design system), jamais de variante locale.
11. Avant de livrer : tester à 360 px et 1024 px, clavier seul, connexion lente simulée.
