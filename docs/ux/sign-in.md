# Fiche UX — Se connecter

- **Route** : `/sign-in` · **Fonctionnalité(s)** : F02 · **Version** : V1
- **Utilisateur et objectif** : retrouver son espace avec e-mail + mot de passe.
- **Action principale** : « Se connecter », visible sans défilement à 360 px.

## Parcours
1. Arrivée (accès protégé refusé ou lien direct) → 2. saisie → 3. sortie vers la page
demandée (`?next=`) ou `/` ; e-mail non vérifié → `/verify-email`.

## Contenu et hiérarchie
1. Titre « Se connecter ».
2. Formulaire : **E-mail**, **Mot de passe**, option « Rester connecté ».
3. Bouton principal pleine largeur.
4. Liens : « Mot de passe oublié ? » · « Pas encore de compte ? S'inscrire ».

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | bouton désactivé, libellé « Connexion… » |
| Identifiants invalides | « E-mail ou mot de passe incorrect. » (jamais de fuite d'existence) |
| E-mail non vérifié | redirection vers `/verify-email` |
| Trop d'essais | « Trop d'essais, réessaie plus tard. » |
| Hors connexion | « Pas de connexion, réessaie. » |

## Mobile (360 px) puis desktop
Colonne unique, champs pleine largeur ; carte centrée ≤ 400 px sur desktop.

## Accessibilité
`h1` unique, labels liés, `autocomplete` (`email`, `current-password`), focus visible,
erreur globale annoncée (`role="alert"`).

## Composants utilisés
`Button`, `Input`, `Label`, `Card`, `ErrorState`, `FormField` (maison).

## Textes (français)
Titre « Se connecter » · bouton « Se connecter » · liens « Mot de passe oublié ? » et
« Pas encore de compte ? S'inscrire ».
