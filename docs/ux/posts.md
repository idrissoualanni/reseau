# Fiche UX — Posts et commentaires

- **Route** : `/posts` (fil) · `/posts/[id]` (détail) · **Fonctionnalité(s)** : F11 · **Version** : V1
- **Utilisateur et objectif** : un membre connecté publie une activité et en discute avec la communauté.
- **Action principale** : publier un post (ou commenter un post existant).

## Parcours
1. Arrivée depuis la navigation (« Posts ») → 2. lecture du fil → 3. publication d'un post → 4. clic sur un post → détail + commentaires → 5. commenter / répondre à un commentaire → 6. clic sur l'auteur → profil public (F08).

## Contenu et hiérarchie
1. **Titre** : « Posts » (h1).
2. **Champ de publication** : textarea + bouton « Publier » (texte brut, max 1000 caractères).
3. **Fil de posts** (plus récents d'abord) : auteur (avatar + nom, lien profil), texte, date, nombre de commentaires, lien vers le détail.
4. **Détail d'un post** : texte complet + liste de commentaires.
5. **Commentaires** : auteur, texte, date, bouton « Répondre ». Les réponses sont indentées (max 3 niveaux visuels, puis « voir plus »).
6. **Actions** : l'auteur d'un post peut le supprimer ; l'auteur d'un commentaire peut le supprimer (ses réponses sont retirées en cascade).

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | squelettes de posts |
| Vide | « Aucun post pour l'instant. » + CTA « Publier le premier post » |
| Erreur | bandeau d'erreur + « Réessayer » |
| Succès | fil de posts avec commentaires |
| Hors connexion | « Pas de connexion, réessaie. » |

## Mobile (360 px) puis desktop
Colonne unique à 360 px ; desktop : largeur feed, fil centré. Zones tactiles ≥ 44 px.

## Accessibilité
Un seul h1 ; le champ de publication a un label lié ; les boutons d'action ont des libellés explicites ; contrastes AA ; le texte des commentaires est en texte brut (pas de HTML).

## Composants utilisés
`PageShell`, `Card`/`CardContent`, `Button`, `Textarea`, `Avatar`, `EmptyState`, `Skeleton`, composants `posts/post-card`, `posts/post-composer`, `posts/comment-thread` (ajoutés au design system).

## Textes (français)
- Titre : « Posts »
- Publier : « Publier » / placeholder : « Quoi de neuf ? »
- Vide : « Aucun post pour l'instant. » / « Publie le premier pour lancer la discussion. »
- Commenter : « Commenter » · Répondre : « Répondre » · Supprimer : « Supprimer »
- « Voir plus de réponses » · erreur : « Impossible de charger les posts. » · hors connexion : « Pas de connexion, réessaie. »