# Fiche UX — Posts et commentaires

- **Routes** : `/posts` (fil) · `/posts/new` (composition) · `/posts/[id]` (détail)
- **Fonctionnalité(s)** : F11 · F12 · **Version** : V1 → V1.5 (galerie)
- **Utilisateur et objectif** : un membre connecté publie une activité (avec une galerie de 5 images maximum) et en discute avec la communauté.
- **Action principale** : publier un post (ou commenter un post existant).

## Parcours
1. Arrivée depuis la navigation (« Posts ») → 2. lecture du fil **groupé par jour** → 3. clic sur « Publier » → page dédiée `/posts/new` → 4. publication → **retour au fil**, le nouveau post est mis en évidence → 5. clic sur un post → détail + commentaires → 6. commenter / répondre à un commentaire → 7. clic sur l'auteur → profil public (F08).

## Contenu et hiérarchie
1. **Fil `/posts`** — titre « Posts » (h1), sous-titre, bouton primaire « Publier » (lien vers `/posts/new`).
   - **Groupement temporel** : sections par jour — « Aujourd'hui », « Hier », puis la date (« lundi 5 octobre »). Deux jours distincts ne sont **jamais** fusionnés.
   - **Carte de post (hiérarchie)** : ligne d'en-tête (avatar + nom en gras, lien profil ; heure à droite, date complète en `title`/`aria-label`), corps en texte brut (16 px, interligne détendu), **galerie optionnelle** (une image par vue, flèches, compteur `n/5`), puis une **ligne d'action** séparée par un filet discret (« 3 commentaires » / « Commenter »).
   - Le corps **et** chaque image de la galerie sont des liens vers le détail (cible tactile confortable).
2. **Page de composition `/posts/new`** — lien « Retour au fil », titre « Nouveau post » (h1), formulaire plein écran :
   - textarea (texte brut, max 5000 caractères) + aide/caption ;
   - bouton « Ajouter des images » (5 maximum, jpeg/png/webp, 10 Mo par image) ;
   - **couverture** : la première image est signalée « Couverture » ; l'ordre se change en retirant puis en réajoutant une image ;
   - aperçu sous forme de vignettes, retrait possible avant publication ; publication bloquée pendant l'envoi.
   - Après succès → **retour au fil** ; le post publié est **mis en évidence** (ancre `#post-<id>`, anneau d'accent).
3. **Détail `/posts/[id]`** — texte complet + galerie + liste de commentaires.
4. **Commentaires** — auteur, texte, heure, bouton « Répondre ». Les réponses sont indentées (max 3 niveaux visuels). L'auteur d'un commentaire peut le supprimer (cascade).
5. **Actions** : l'auteur d'un post peut le supprimer ; l'auteur d'un commentaire peut le supprimer.

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | squelettes de posts |
| Vide | « Aucun post pour l'instant. » + CTA « Publier le premier post » |
| Erreur | bandeau d'erreur + « Réessayer » |
| Succès | fil groupé par jour ; post publié mis en évidence |
| Upload image | vignette en chargement, bouton de publication désactivé, erreur affichée dans le formulaire |
| Hors connexion | « Pas de connexion, réessaie. » |

## Mobile (360 px) puis desktop
Colonne unique à 360 px ; en-tête de fil : titre + bouton « Publier » (cible ≥ 44 px). Desktop : largeur feed, fil centré. Pas de défilement horizontal.

## Accessibilité
Un seul h1 par page (fil, composition, détail) ; labels liés ; boutons d'action explicites ; focus visible ; contrastes AA ; le corps et l'image sont des liens focusables ; le post mis en évidence ne repose **pas sur la couleur seule** (anneau + position dans le fil) ; texte brut (pas de HTML).

## Composants utilisés
`PageShell`, `Card`/`CardContent`, `Button`, `Textarea`/`TextareaField`, `Avatar`, `EmptyState`, `Skeleton`, composants `posts/post-card`, `posts/post-composer`, `posts/comment-thread`, `posts/comment-input` (design system). Utilitaire `posts-grouping`.

## Textes (français)
- Titre : « Posts » · « Nouveau post »
- Publier : « Publier » / « Publier le premier post » / placeholder « Quoi de neuf ? »
- Aperçu image : « Aperçu : voici comment l'image apparaîtra dans le fil. »
- Vide : « Aucun post pour l'instant. » / « Publie le premier pour lancer la discussion. »
- Commenter : « Commenter » · Répondre : « Répondre » · Supprimer : « Supprimer »
- « Voir plus » · erreur : « Impossible de charger les posts. » · hors connexion : « Pas de connexion, réessaie. »
- Groupes : « Aujourd'hui », « Hier », puis la date (« lundi 5 octobre »).
