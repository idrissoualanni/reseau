---
description: Frontend et UX — miroir OpenCode de .claude/rules/frontend-ux.md
---
# Frontend et UX (miroir)

0. **`DESIGN.md` d'abord** (référence opposable). Détail : `.opencode/rules/design-ui.md`.
1. Fiche `docs/ux/<page>.md` avant toute page : parcours, cinq états, mobile, a11y, textes.
2. Composants de `src/components/ui` ou `DESIGN.md` §6. Tokens uniquement, aucune valeur en dur.
3. Mobile 360 px d'abord, cibles ≥ 44 px, aucun défilement horizontal.
4. Chargement (squelette), vide, erreur (« Réessayer »), succès, hors connexion.
5. Composants serveur par défaut ; `"use client"` pour l'interactivité seulement.
6. Zod client **et** serveur, erreur sous le champ, saisie conservée, bouton désactivé.
7. `next/image` + `alt` + `sizes` ; `lazy` sauf image LCP ; pas de bibliothèque lourde.
8. Un seul `h1`, labels liés, focus visible, ordre clavier, AA, jamais la couleur seule.
9. Français, tutoiement, phrases courtes.
10. Composant manquant : demander au `designer` (ajout à `DESIGN.md`), pas de variante locale.
11. Avant livraison : checklist `DESIGN.md` §13, 360/1024 px, clavier, connexion lente.
