# Fiche UX — Éditeur de projet (création + édition)

- **Route** : `/me/projects/new`, `/me/projects/[id]/edit` · **Fonctionnalité(s)** : F05 + F06 · **Version** : V1
- **Utilisateur et objectif** : un membre connecté crée ou modifie un projet pour le publier et le rendre visible.
- **Action principale** : « Publier » (création) ou « Enregistrer » (édition), visible sans défilement à 360 px.

## Parcours
1. Arrivée depuis `/me/projects` (liste) → 2. saisie du titre, du texte, des compétences →
3. ajout d'une couverture (optionnel) → 4. publication → 5. retour à `/me/projects` avec le statut « publié ».

## Contenu et hiérarchie
1. **Titre du projet** (obligatoire, 3–120 car.) : champ de saisie.
2. **Texte du projet** (facultatif, ≤ 5000 car.) : zone de texte multiligne.
3. **Compétences** (facultatif, max 10) : champ avec autocomplétion (référentiel `skills`).
4. **Couverture** (V1.5 : galerie de 5 images) : upload présigné par image (`project-cover`), vignettes avec la première marquée « Couverture », retrait possible ; publication bloquée pendant l'envoi.
5. **Actions** : « Enregistrer » (brouillon), « Publier » (édition), « Retour » (annuler).
6. **Actions d'édition** : « Publier » / « Dépublier », « Supprimer » (avec confirmation).

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | squelette du formulaire (édition : données existantes) |
| Vide (création) | formulaire vide, bouton « Publier » désactivé tant que le titre est vide |
| Erreur | bandeau au-dessus du formulaire ou sous le champ ; « Réessayer » recrée l'action |
| Succès | redirection vers `/me/projects` avec statut mis à jour |
| Hors connexion | « Pas de connexion, réessaie. » ; la saisie reste à l'écran |
| Publication | bandeau « Projet publié. » ; le projet apparaît dans le fil (F07) |

## Mobile (360 px) puis desktop
Colonne unique, champs pleine largeur, marges 16 px. À partir de 640 px : carte centrée `max-w-content`, couverture à droite du titre sur desktop.

## Accessibilité
`h1` unique (« Nouveau projet » / « Modifier le projet »), labels liés, `aria-live` sur les messages de succès/erreur, suppression par un bouton nommé (« Supprimer le projet »), focus visible, cibles ≥ 44 px.

## Composants utilisés
`PageShell`, `FormField`, `TextareaField`, `SkillsField`, `ProjectCoverUpload`, `Button`, `Card`, `CardContent`, `EmptyState` (liste vide).

## Textes (français)
Titres « Nouveau projet », « Modifier le projet » · boutons « Enregistrer », « Publier », « Retour », « Supprimer » · succès « Projet publié. », « Projet enregistré. » · vide « Aucun projet pour l'instant. Crée ton premier projet. »
