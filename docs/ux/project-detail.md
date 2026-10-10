# Fiche UX — Détail d'un projet

- **Route** : `/projects/[id]` · **Fonctionnalité(s)** : F07 · **Version** : V1
- **Utilisateur et objectif** : un membre connecté lit le texte complet d'un projet publié et repère qui l'a réalisé.
- **Action principale** : aller au profil de l'auteur.

## Parcours
1. Arrivée depuis le fil (`/`) → 2. lecture du projet (texte, compétences) → 3. clic sur l'auteur → profil public (F08) ; retour via la sidebar.

## Contenu et hiérarchie
1. **Titre du projet** (h1), date de publication.
2. **Auteur** : avatar + nom + `@username` (lien `/u/[username]`).
3. **Texte complet** du projet.
4. **Compétences** : badges du référentiel (toutes).
5. **Couverture** : image si présente, sinon visuel par défaut décoratif.

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | squelette du détail |
| Vide / introuvable | page « Projet introuvable » (404) — y compris pour un brouillon d'un autre membre |
| Erreur | bandeau d'erreur + « Réessayer » |
| Succès | contenu complet du projet |
| Hors connexion | « Pas de connexion, réessaie. » |

## Mobile (360 px) puis desktop
Colonne unique, texte en pleine largeur ; desktop : largeur feed, auteur et compétences en tête.

## Accessibilité
Un seul h1 ; liens explicites ; alt descriptif sur la couverture (`alt=""` si décorative) ; contrastes AA.

## Composants utilisés
`PageShell`, `Card`/`CardContent`, `Avatar`, `Badge` (+ `SkillBadge`), `EmptyState` (404), `Skeleton`.

## Textes (français)
- 404 : « Projet introuvable. » / « Il a peut-être été supprimé ou n'est pas publié. »
- Erreur : « Impossible de charger le projet. » · hors connexion : « Pas de connexion, réessaie. »