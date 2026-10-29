---
description: UI et design system — miroir OpenCode de .claude/rules/design-ui.md
---
# Design UI (miroir)

Sources : **`DESIGN.md`** > `docs/design-system.md` > `docs/ux/<page>.md`. `DESIGN.md` gagne.

## Tokens uniquement

`background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent` (survol),
`brand` (accent de marque), `success`, `success-strong`, `destructive`, `danger-strong`,
`warning`, `info`, `border`, `input`, `ring`.
Rayon 10 / 12 / **14** / 18 · `shadow-card` · `shadow-popover` · Inter · espacements
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

Interdit : HEX, `rgb()`, `oklch()`, `text-[#…]`, `bg-blue-500`, style inline, valeur hors échelle.

## Couleurs vérifiées

- `bg-primary text-primary-foreground` 5,70:1 · `text-primary` pour lien/nav active.
- `--brand` (teal) : icônes/halos seulement, jamais du texte sur blanc (3,07:1).
- Succès : `bg-success-strong text-white` 5,87:1 — **jamais** `bg-success text-white` (3,41:1).
- Danger : `bg-destructive text-white` 4,83:1 · `text-danger-strong` pour le texte.
- Texte discret : `#5B6B8A` (`text-muted-foreground`), pas `#737373` sur `#F6F8FC`.
- AA 4,5:1 texte, 3:1 grand texte/icônes ; statut = icône + libellé.

## Composants

`src/components/ui/**` ou `DESIGN.md` §6 uniquement. Aucune variante locale, aucun primitif
modifié sans mise à jour de `DESIGN.md`. `Dialog`, `Toast`, `Alert`, `Table` non installés :
ne pas les utiliser ; confirmation destructive inline et nommée.

## États et formats

Chargement (squelette), vide, erreur (« Réessayer »), succès, hors connexion. Mobile 360 px,
cibles ≥ 44 px, pas de scroll horizontal, un seul `h1`, focus visible, labels liés.
Formulaires : erreur sous le champ (`role="alert"`), saisie conservée, bouton désactivé.
Images : `next/image`, `alt`, `sizes`, lazy sauf LCP.

## Validation

Checklist `DESIGN.md` §13 entièrement passée, sinon l'écran n'est pas terminé.
