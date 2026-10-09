# Fiche UX — Mot de passe oublié

- **Route** : `/forgot-password` · **Fonctionnalité(s)** : F02 · **Version** : V1
- **Utilisateur et objectif** : recevoir un code, puis choisir un nouveau mot de passe.
- **Action principale** : « Envoyer le code » (étape 1) / « Changer le mot de passe » (étape 2).

## Parcours
1. Arrivée depuis `/sign-in` → 2. saisie de l'e-mail → 3. réception du code → 4. saisie
code + nouveau mot de passe → 5. sortie vers `/sign-in` avec confirmation.

## Contenu et hiérarchie
1. Titre « Mot de passe oublié ».
2. **Étape 1** : champ E-mail + bouton « Envoyer le code ».
3. **Étape 2** (après envoi) : champ code (6 chiffres) + champ nouveau mot de passe +
   bouton « Changer le mot de passe ».
4. Lien « Retour à la connexion ».

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | bouton désactivé |
| E-mail inconnu | message **neutre** « Si cette adresse est valide, tu vas recevoir un code. » |
| Code invalide/expiré | « Ce code est invalide ou expiré. » |
| Succès | retour à `/sign-in` avec confirmation |

## Mobile (360 px) puis desktop
Colonne unique ; deux étapes sur la même route (pas de navigation) ; carte ≤ 400 px desktop.

## Accessibilité
`h1` unique, labels liés, `autocomplete` (`email`, `one-time-code`, `new-password`),
focus déplacé sur le premier champ de l'étape 2, erreurs annoncées.

## Composants utilisés
`Button`, `Input`, `Label`, `Card`, `ErrorState`, `FormField` (maison).

## Textes (français)
Titre « Mot de passe oublié » · boutons « Envoyer le code » / « Changer le mot de passe » ·
lien « Retour à la connexion ».
