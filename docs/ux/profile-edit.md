# Fiche UX — Mon profil (édition + compétences)

- **Route** : `/me/profile` · **Fonctionnalité(s)** : F10 + F04 · **Version** : V1
- **Utilisateur et objectif** : un membre connecté met à jour son identité et enrichit son
  profil de compétences pour être trouvé et crédible.
- **Action principale** : « Enregistrer » (identité). La seconde action, « Ajouter » une
  compétence, est visible sans défilement à 360 px.

## Parcours
1. Arrivée depuis la navigation (« Mon profil ») ou après l'onboarding → 2. en-tête du
   profil (avatar/initiale, nom affiché, `@username`) → 3. formulaire d'identité → 
   4. section « Compétences » (ajout avec suggestions, liste de badges, suppression) →
   5. sortie : le profil public `/u/[username]` (F08, lot ultérieur).

> **F13** — section « Photo de profil » (au-dessus d'« Informations ») : avatar affiché,
> bouton « Changer » (choix d'image, upload présigné) et « Retirer » si une photo existe.
> Une image choisie s'affiche immédiatement (aperçu local) puis est confirmée par
> rafraîchissement de la page. Formats jpeg/png/webp/gif, ≤ 5 Mo.

## Contenu et hiérarchie
1. En-tête : avatar (image si présente, sinon initiale), nom affiché (`h1`), `@username`.
2. **Photo de profil** (F13) — `AvatarUploader` : avatar, « Changer », « Retirer ».
3. **Informations** — nom d'utilisateur en lecture seule (non modifiable), nom affiché,
   bio, école, filière ; bouton « Enregistrer » ; message de succès après enregistrement.
4. **Compétences** — champ d'ajout avec autocomplétion sur le référentiel, compteur
   `n/30`, liste de badges (niveau `declared` par défaut, `demonstrated` dès qu'un projet
   publié la porte — F06/F05, lot ultérieur), suppression par badge.

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | squelette de la carte d'identité + lignes de badges |
| Vide (compétences) | « Aucune compétence pour l'instant. Ajoute-en pour être trouvable. » |
| Vide (biographie) | champs facultatifs vides, sans message d'erreur |
| Erreur | bandeau au-dessus du formulaire concerné ou sous le champ ; « Réessayer » recrée l'action |
| Succès (identité) | bandeau « Profil mis à jour. », saisie conservée |
| Succès (compétence) | le badge apparaît immédiatement ; champ vidé |
| Hors connexion | « Pas de connexion, réessaie. » ; la saisie et les badges restent à l'écran |
| Limite atteinte | champ d'ajout désactivé, message « Tu peux ajouter jusqu'à 30 compétences. » |
| Déjà ajoutée | « Tu as déjà cette compétence. » |

## Mobile (360 px) puis desktop
Colonne unique. Le champ d'ajout et le bouton « Ajouter » s'empilent en dessous de
640 px, côte à côte au-dessus. Les badges s'enroulent sur plusieurs lignes. À partir de
640 px : carte centrée `max-w-content`, école/filière sur deux colonnes.

## Accessibilité
`h1` unique (nom affiché), sections `h2` (« Informations », « Compétences »), labels liés,
`aria-live` sur les messages de succès et d'erreur de compétence, suppression d'un badge
par un bouton nommé (« Retirer React »), niveau de preuve porté par une icône + un libellé
lu par le lecteur d'écran (jamais la couleur seule), focus visible, cibles ≥ 44 px.

## Composants utilisés
`PageShell`, `Avatar`, `AvatarUploader`, `FormField`, `TextareaField`, `SkillBadge`,
`SkillsField`, `Button`, `Card`, `CardContent`, `EmptyState` (liste vide).
**Ajoutés au design system (Lot 2)** : `Avatar`, `SkillBadge`, `SkillsField`,
`Textarea`, `TextareaField`, `UsernameField`.

## Textes (français)
Titres « Informations », « Compétences » · boutons « Enregistrer », « Ajouter » ·
succès « Profil mis à jour. » · vide « Aucune compétence pour l'instant. Ajoute-en pour
être trouvable. » · limite « Tu peux ajouter jusqu'à 30 compétences. ».
