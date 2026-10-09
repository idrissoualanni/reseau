# Fiche UX — Créer son compte

- **Route** : `/sign-up` · **Fonctionnalité(s)** : F01 · **Version** : V1
- **Utilisateur et objectif** : un visiteur crée un compte (nom, e-mail, mot de passe)
  et reçoit un code à 6 chiffres pour vérifier son e-mail.
- **Action principale** : « Créer mon compte », visible sans défilement à 360 px.

## Parcours
1. Arrivée depuis `/sign-in` ou un lien direct → 2. saisie du formulaire → 3. soumission
→ 4. envoi du code → 5. sortie vers `/verify-email?email=…`.

## Contenu et hiérarchie
1. Titre « Créer ton compte » + phrase d'accroche courte.
2. Formulaire : **Nom**, **E-mail**, **Mot de passe** (≥ 8 caractères), widget anti-robot.
3. Bouton principal pleine largeur.
4. Lien secondaire « Déjà un compte ? Se connecter ».

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | bouton désactivé, libellé « Création… » |
| Validation | message sous le champ concerné, saisie conservée |
| Erreur anti-robot | bandeau « Vérification anti-robot échouée, réessaie. » |
| Erreur réseau | bandeau « Pas de connexion, réessaie. » |
| Succès | redirection vers `/verify-email` |

## Mobile (360 px) puis desktop
Colonne unique, champs pleine largeur, marges 16 px ; carte centrée ≤ 400 px sur desktop.

## Accessibilité
`h1` unique, labels liés, `autocomplete` (`name`, `email`, `new-password`), focus visible,
erreurs annoncées (`role="alert"`), contraste AA.

## Composants utilisés
`Button`, `Input`, `Label`, `Card`, `ErrorState`, `FormField` (maison).
**À ajouter au design system** : `TurnstileWidget` (anti-robot).

## Textes (français)
Titre « Créer ton compte » · bouton « Créer mon compte » · lien « Déjà un compte ? Se connecter ».
