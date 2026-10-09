# Fiche UX — Vérifier son e-mail

- **Route** : `/verify-email` · **Fonctionnalité(s)** : F01 · **Version** : V1
- **Utilisateur et objectif** : saisir le code à 6 chiffres reçu par e-mail pour activer
  le compte, en moins de 30 secondes.
- **Action principale** : « Vérifier », visible sans défilement à 360 px.

## Parcours
1. Redirection depuis `/sign-up` (le code vient d'être envoyé) → 2. saisie du code
→ 3. sortie vers `/onboarding/profile` (F03).

## Contenu et hiérarchie
1. Titre « Vérifie ton e-mail » + rappel de l'adresse cible.
2. Champ code (6 chiffres, `inputMode="numeric"`, `autocomplete="one-time-code"`).
3. Bouton principal « Vérifier ».
4. Lien « Renvoyer le code » (désactivé 60 s après un envoi).

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | bouton désactivé, libellé « Vérification… » |
| Code invalide/expiré | « Ce code est invalide ou expiré. » |
| Renvoi | confirmation « Nouveau code envoyé. » puis compte à rebours |
| Trop d'envois | « Réessaie dans une minute. » |
| Succès | redirection vers `/onboarding/profile` |

## Mobile (360 px) puis desktop
Colonne unique ; champ code centré, largeur confortable ; carte ≤ 400 px sur desktop.

## Accessibilité
`h1` unique, label lié, `autocomplete="one-time-code"`, focus placé sur le champ à l'arrivée,
erreurs annoncées, pas de communication par la couleur seule.

## Composants utilisés
`Button`, `Input`, `Label`, `Card`, `ErrorState`, `FormField` (maison).

## Textes (français)
Titre « Vérifie ton e-mail » · bouton « Vérifier » · lien « Renvoyer le code ».
