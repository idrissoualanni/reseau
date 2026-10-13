# Fiche UX — Console d'administration plateforme

Écrite avant le code (règle `docs/ux/_template.md`).

- **Route** : `/admin`, `/admin/spaces`, `/admin/access-log`,
  `/admin/profiles`, `/admin/posts`, `/admin/projects`, `/admin/otp`
- **Fonctionnalité(s)** : F14, F16, F17 · **Version** : V1.5
- **Utilisateur et objectif** : un compte au rôle `admin` (Neon Auth) vient
  créer/configurer les espaces, **voir tout le contenu** et consulter le journal d'accès,
  en moins de 30 secondes.
- **Action principale** : « Créer un espace » (visible sans défilement à 360 px).

## Parcours

1. Arrivée depuis le sidebar (entrée « Admin ») → 2. tableau de bord (compteurs, derniers
   accès) → 3. création/édition d'un espace → 4. retour au tableau de bord avec confirmation.

## Contenu et hiérarchie

1. En-tête « Administration » + rôle.
2. Bouton primaire « Créer un espace ».
3. Compteurs : espaces actifs, espaces archivés.
4. Tableau « Espaces » : nom, type, visibilité, membres, statut, actions.
5. Journal d'accès : date, espace, profil, méthode, action.
6. Vues de lecture « tout voir » : profils, posts, projets (brouillons inclus, badge).
7. Onglet « OTP » : journal des **envois** (adresse, type, date, résultat), **jamais le
   code**. Mention explicite en tête : « Le code n'est jamais visible (généré et envoyé
   par Neon Auth). »

## États

| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | squelette de tableau (lignes grises) |
| Vide | « Aucun espace. Crée le premier. » + bouton |
| Erreur | message + « Réessayer » |
| Succès | toast « Espace créé » |
| Hors connexion | message clair, saisie conservée |

## Mobile (360 px) puis desktop

- 360 px : listes en cartes empilées, action en pleine largeur, sidebar en overlay.
- Desktop : tableaux en 5–6 colonnes, actions alignées à droite (slot de largeur fixe).

## Accessibilité

- Un seul `h1` par page ; `th scope="col"` ; labels explicites ; focus visible ; boutons
  destructifs avec confirmation textuelle ; contrastes AA.

## Composants utilisés

`sidebar`, `card`, `table`, `button`, `input`, `select`, `textarea`, `badge`, `dialog`,
`toast`, `form`. Aucun nouveau composant sans l'ajouter d'abord au design system.

## Textes (français)

- Titres : « Administration », « Espaces », « Journal d'accès ».
- Boutons : « Créer un espace », « Enregistrer », « Archiver ».
- Erreurs : « Accès refusé », « Un espace utilise déjà ce slug ».
