# Fiche UX — Profil public d'un membre

- **Route** : `/u/[username]` · **Fonctionnalité(s)** : F08 · **Version** : V1
- **Utilisateur et objectif** : un membre connecté consulte le profil d'un autre étudiant pour évaluer ce qu'il sait faire (compétences prouvées, projets publiés).
- **Action principale** : consulter les projets publiés (ou gérer son propre profil si le profil est le sien).

## Parcours
1. Arrivée depuis un projet, la recherche ou la sidebar → 2. lecture de l'identité et des compétences → 3. parcours des projets publiés → 4. (si c'est mon profil) boutons « Modifier mon profil » / « Nouveau projet ».

## Contenu et hiérarchie
1. **Identité** : avatar, nom, `@username`.
2. **Bio, établissement, filière** (si renseignés).
3. **Compétences** (tri : niveau décroissant puis nom) : badges avec icône + libellé pour `demonstrated` (accessible non visuel).
4. **Projets publiés** : liste paginée (plus récents d'abord), mêmes cartes que le fil.
5. **Si c'est mon profil** : boutons de gestion (modifier le profil, nouveau projet).

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | squelette du profil |
| Vide | profil sans compétences ni projets : message « Aucun projet publié pour l'instant. » |
| Erreur | « Profil introuvable » (404) quand le username est inconnu ; bandeau + « Réessayer » sinon |
| Succès | profil complet avec compétences et projets |
| Hors connexion | « Pas de connexion, réessaie. » |

## Mobile (360 px) puis desktop
Colonne unique (identité, bio, compétences, projets) ; desktop : largeur feed, identité en tête.
Zones tactiles ≥ 44 px.

## Accessibilité
Un seul h1 (nom) ; badges de niveau lisibles sans la couleur (icône + texte « démontrée ») ; liens explicites ;
aucune donnée privée exposée (e-mail, identifiants internes).

## Composants utilisés
`PageShell`, `Avatar`, `SkillBadge`, `Badge`, `Card`/`CardContent`, `Button`, `EmptyState`, `Skeleton`, composant `projects/project-card` (réutilisé du fil).

## Textes (français)
- 404 : « Profil introuvable. » / « Ce membre n'existe pas ou a supprimé son compte. »
- « Modifier mon profil » · « Nouveau projet » · vide : « Aucun projet publié pour l'instant. »