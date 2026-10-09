# Fiche UX — Fil des projets (accueil)

- **Route** : `/` · **Fonctionnalité(s)** : F07 · **Version** : V1
- **Utilisateur et objectif** : un membre connecté découvre les projets publiés des autres étudiants pour s'inspirer et repérer des profils.
- **Action principale** : ouvrir un projet (aller au détail).

## Parcours
1. Arrivée depuis la sidebar (« Projets ») → 2. lecture de la liste → 3. filtre facultatif par compétence → 4. « Voir plus » pour charger la suite → 5. clic sur une carte → détail du projet → 6. clic sur l'auteur → profil public (F08).

## Contenu et hiérarchie
1. **Titre** : « Projets » (h1).
2. **Filtre par compétence** : champ texte + bouton « Filtrer » (facultatif, soumet `?skill=`).
3. **Cartes de projets** (les plus récents d'abord) : visuel de couverture ou image par défaut, titre (lien), extrait du texte (3 lignes), auteur (avatar + nom, lien vers `/u/[username]`), compétences (max 3 + « +n »), date de publication.
4. **« Voir plus »** : charge la page suivante au curseur, sans doublon.

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | squelettes de cartes |
| Vide | message « Aucun projet publié. » + CTA « Créer un projet » |
| Erreur | bandeau d'erreur + « Réessayer » |
| Succès | liste des projets publiés |
| Hors connexion | « Pas de connexion, réessaie. » ; la liste reste affichée |

## Mobile (360 px) puis desktop
Colonne unique de cartes à 360 px ; sur desktop, page centrée (`PageShell`, largeur feed), filtre en haut à droite.
Zones tactiles ≥ 44 px ; pas de défilement horizontal.

## Accessibilité
Un seul h1 ; liens avec libellés explicites (titre, nom de l'auteur) ; contrastes AA ; le filtre a un label lié ;
l'image par défaut porte `alt=""` (décorative).

## Composants utilisés
`PageShell`, `Card`/`CardContent`, `Button`, `Input`, `Label`, `Avatar`, `Badge` (+ maison `SkillBadge`), `EmptyState`, `Skeleton`, composants `projects/project-card` et `projects/project-feed` (ajoutés au design system).

## Textes (français)
- Titre : « Projets »
- Filtre : « Filtrer par compétence » / bouton « Filtrer »
- Vide : « Aucun projet publié. » / « Crée le premier projet pour prouver ce que tu sais faire. »
- « Voir plus » · erreur : « Impossible de charger les projets. » · hors connexion : « Pas de connexion, réessaie. »