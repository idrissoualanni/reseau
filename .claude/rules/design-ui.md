---
description: UI, design system et cohérence visuelle — à lire avant tout écran ou composant.
paths: ["src/app/**", "src/components/**", "src/modules/*/components/**"]
---
# Design UI

Sources, dans cet ordre : **`DESIGN.md`** > `docs/design-system.md` > `docs/ux/<page>.md`.
En cas de conflit, `DESIGN.md` gagne.

## 1. Tokens uniquement

- Couleurs : `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`
  (survol), `brand` (accent de marque), `success`, `success-strong`, `destructive`,
  `danger-strong`, `warning`, `info`, `border`, `input`, `ring`.
- Rayon : `rounded-sm` 10 · `rounded-md` 12 · `rounded-lg` **14 (défaut)** · `rounded-xl` 18.
- Ombre : `shadow-card` (cartes) · `shadow-popover` (menus/flottants).
- Typo : Inter, échelle `DESIGN.md` §3. Corps 16 px, petit 14 px, légende 12 px minimum.
- Espacement : 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Aucune valeur intermédiaire.

**Interdit** : `#HEX`, `rgb()`, `oklch()`, `text-[#…]`, `bg-blue-500`, `p-[13px]`, style inline.

## 2. Couleurs — règles vérifiées

| Usage | Autorisé | Interdit |
|---|---|---|
| Action primaire | `bg-primary text-primary-foreground` (5,70:1) | texte violet sur surface saturée |
| Lien / nav active | `text-primary` | violet en fond de grande surface |
| Accent de marque | `text-brand` sur icône, halo | `text-brand` sur fond blanc (3,07:1) |
| Succès | `bg-success-strong text-white` (5,87:1) | `bg-success text-white` (3,41:1) |
| Danger | `bg-destructive text-white` (4,83:1) · `text-danger-strong` | texte `#D64545` sur blanc (4,38:1) |
| Texte discret | `text-muted-foreground` `#5B6B8A` | `#737373` sur `#F6F8FC` (4,46:1) |

- AA : 4,5:1 (texte), 3:1 (grand texte ≥ 24 px ou 18,66 px gras, icônes).
- Un statut = **icône + libellé**, jamais la couleur seule.

## 3. Composants

- Utiliser `src/components/ui/**` ou les composants listés dans `DESIGN.md` §6.
- Ne jamais modifier un primitif shadcn sans mettre à jour `DESIGN.md`.
- Toute variante nouvelle se documente dans `DESIGN.md` **avant** le code.
- `Dialog`, `Toast`, `Alert`, `Table` ne sont pas installés : ne pas les utiliser.
  Confirmation destructive = bloc inline ou page dédiée nommant l'objet.

## 4. États et formats

- Cinq états obligatoires : chargement (squelette), vide, erreur (« Réessayer »), succès,
  hors connexion.
- Mobile 360 px d'abord ; cibles ≥ 44 px ; aucun défilement horizontal.
- Un seul `h1` ; labels liés ; focus visible (`ring-3` + bordure `ring`) ; `Échap` ferme.
- Formulaires : erreur sous le champ (`role="alert"`), saisie conservée, bouton désactivé
  pendant l'envoi.
- Images : `next/image`, `alt`, `sizes`, `lazy` sauf LCP. Aucun texte incrusté.

## 5. Porte de validation

Aucun écran n'est « terminé » si la checklist `DESIGN.md` §13 n'est pas passée intégralement.
Une exception se justifie dans `DESIGN.md` (section « Décisions à valider ») et dans l'ADR.
