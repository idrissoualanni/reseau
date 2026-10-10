# Fiche UX — Recherche d'étudiants par compétence

- **Route** : `/search` · **Fonctionnalité(s)** : F09 · **Version** : V1
- **Utilisateur et objectif** : un membre connecté trouve des étudiants qui maîtrisent une compétence donnée, classés par force de preuve.
- **Action principale** : lancer la recherche (champ + bouton « Rechercher »).

## Parcours
1. Arrivée depuis la navigation (« Recherche ») → 2. saisie avec autocomplétion (une compétence, `GET /api/skills`) → 3. résultats dans l'URL (`?skill=react`) → 4. clic sur un résultat → profil public (F08) ; « Voir plus » pour la suite.

## Contenu et hiérarchie
1. **Titre** : « Recherche » (h1).
2. **Champ compétence** : autocomplétion (réutilise `skills-field` / `GET /api/skills`), bouton « Rechercher ». État partagé dans l'URL : `/search?skill=react`.
3. **Résultats** (tri : `demonstrated` avant `declared`, puis nombre de projets publiés portant la compétence décroissant, puis inscription récente) : avatar, nom, `@username`, établissement/filière, badge de niveau de preuve pour cette compétence, nombre de projets liés. Lien vers `/u/[username]`.
4. **« Voir plus »** : curseur opaque, 20 par page, sans doublon ni saut.
5. **Compétence inconnue** : message « Aucun résultat » + suggestions proches (trigramme) cliquables.

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | champ + squelettes de résultats |
| Vide | « Aucun résultat pour cette compétence. » + suggestions proches cliquables |
| Erreur | bandeau d'erreur + « Réessayer » |
| Succès | liste des profils triés par force de preuve |
| Hors connexion | « Pas de connexion, réessaie. » |

## Mobile (360 px) puis desktop
Champ pleine largeur, résultats en colonne unique ; desktop : champ centré (max 480 px), résultats en grille 2 colonnes. Zones tactiles ≥ 44 px.

## Accessibilité
Un seul h1 ; le champ a un label lié ; les suggestions sont des boutons/liens explicites ; le niveau de preuve est lisible sans la couleur (icône + texte) ; contrastes AA.

## Composants utilisés
`PageShell`, `Input`, `Label`, `Button`, `Avatar`, `Badge` (+ `SkillBadge`), `Card`/`CardContent`, `EmptyState`, `Skeleton`, `skills-field` (autocomplétion existante), composant `search/search-results` (ajouté au design system).

## Textes (français)
- Titre : « Recherche »
- Champ : « Compétence » / placeholder « ex. React » / bouton « Rechercher »
- Vide : « Aucun résultat pour cette compétence. » / « Essaye une compétence proche : »
- « Voir plus » · erreur : « Impossible de charger les résultats. » · hors connexion : « Pas de connexion, réessaie. »
- Résultat : « démontrée » / « déclarée » · « {n} projet(s) »