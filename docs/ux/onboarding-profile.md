# Fiche UX — Créer son profil

- **Route** : `/onboarding/profile` · **Fonctionnalité(s)** : F03 · **Version** : V1
- **Utilisateur et objectif** : un membre vient de vérifier son e-mail et n'a pas encore
  de profil. Il choisit un nom d'utilisateur unique et renseigne son identité en moins de
  deux minutes pour entrer dans le réseau.
- **Action principale** : « Créer mon profil », visible sans défilement à 360 px.

## Parcours
1. Arrivée depuis `/verify-email` (ou n'importe quelle page protégée qui redirige ici
   faute de profil) → 2. saisie du nom d'utilisateur (disponibilité vérifiée en direct)
   → 3. identité (nom affiché, bio, école, filière) → 4. soumission → 5. sortie vers
   `/me/profile` où il pourra ajouter ses compétences.

## Contenu et hiérarchie
1. Titre « Crée ton profil » + phrase : le nom d'utilisateur est permanent.
2. **Nom d'utilisateur** (obligatoire) : champ + état de disponibilité ; aide « 3 à 30
   caractères : minuscules, chiffres, tiret bas (_) » ; mention « Non modifiable après la
   création ».
3. **Nom affiché** (obligatoire) : tel qu'il apparaîtra partout.
4. **Bio** (facultatif, 500 car. max) : zone de texte.
5. **École / université** et **Filière** (facultatifs, 100 car. max) : côte à côte
   ≥ 640 px, empilés en dessous.
6. Bouton principal pleine largeur sur mobile.
7. Emplacement avatar (initiale) : **différé** — l'upload arrive avec F06 (stockage non
   tranché). Aucun élément d'upload n'est affiché en V1 ; le profil naît avec l'initiale
   du nom affiché.

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | bouton désactivé, libellé « Création… » |
| Disponibilité | « Vérification… » (spinner), « Ce nom est disponible. » (succès), « Ce nom est déjà pris. » ou « Ce nom n'est pas disponible. » (erreur) |
| Validation | message sous le champ concerné, saisie conservée |
| Conflit serveur | bandeau « Ton profil existe déjà. » ou « Ce nom d'utilisateur est déjà utilisé. » |
| Erreur réseau | bandeau « Une erreur est survenue, réessaie. » ; la saisie reste |
| Succès | redirection vers `/me/profile` |
| Déjà un profil | redirection immédiate vers `/me/profile` (pas d'écran vide) |

## Mobile (360 px) puis desktop
Colonne unique, champs pleine largeur, marges 16 px. À partir de 640 px : carte centrée
`max-w-content` (640 px), école/filière sur deux colonnes, bouton aligné à gauche.
Aucune barre d'action flottante.

## Accessibilité
`h1` unique (le titre de page, pas un `CardTitle`), labels liés, `autocomplete`
(`username`, `name`), focus visible, erreurs `role="alert"`, état de disponibilité en
`aria-live="polite"` (jamais uniquement par la couleur : icône + texte), contraste AA,
cibles ≥ 44 px. La bio a une limite indiquée avant la saisie.

## Composants utilisés
`PageShell`, `FormField`, `TextareaField`, `UsernameField`, `Button`, `Card`,
`CardContent`.
**Ajoutés au design system (Lot 2)** : `Textarea`, `TextareaField`, `UsernameField`.

## Textes (français)
Titre « Crée ton profil » · sous-titre « Ton nom d'utilisateur est permanent : choisis-le
bien. » · bouton « Créer mon profil » · disponibilité « Ce nom est disponible. / Ce nom
est déjà pris. » · conflit « Ton profil existe déjà. ».
