# UX — Messagerie (`/messages`)

- **Fiche** : F34 · **Statut** : brief validé pour développement
- **Tokens** : `#2F66DB` primaire · `#12A594` accent · `#F6F8FC` surface ·
  `#10203F` texte · radius 14 px · motion 180 ms ease-out · Inter/system-ui

## Objectif

Un espace calme, lisible et rapide pour lire et répondre à une conversation privée,
sans exposer le contenu au serveur.

## Structure

### Desktop

```
┌──────────────┬──────────────────────────────────────────┐
│ Sidebar      │ Conversation                              │
│ app          │ ┌──────────────────────────────────────┐ │
│              │ │ En-tête : avatar, nom, présence      │ │
│ Messages     │ ├──────────────────────────────────────┤ │
│  • Amina  2  │ │ Fil (messagesgroupés par jour)       │ │
│  • Yann      │ │                                      │ │
│              │ ├──────────────────────────────────────┤ │
│              │ │ Composer : emoji, champ, envoyer     │ │
│              │ └──────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────┘
```

- Liste des conversations : 320 px, avatar 40 px, nom, extrait, heure, badge non lu.
- Fil : largeur max 720 px, messages à gauche (reçu) / droite (envoyé).
- Composer collé en bas, fond surface, bordure douce `shadow.card`.

### Mobile

- Une seule colonne : liste ↔ fil avec bouton retour.
- En-tête compact, avatar 32 px.
- Composer fixe au-dessus du clavier (`env(safe-area-inset-bottom)`).

## Composants shadcn

`Sidebar` (navigation existante), `Bubble`, `Message`, `MessageScroller`,
`Skeleton`, `Button`, `Textarea`, `Avatar`, `Badge`, `DropdownMenu`.
Sélecteur emoji : `emoji-picker-react`, dans un `Popover`.

## États

| État | Rendu |
|---|---|
| Chargement | 5 lignes `Skeleton` dans la liste + fil |
| Aucune conversation | Illustration légère + « Commencez une conversation » |
| Clé absente | Carte d'activation E2E, bouton « Configurer sur cet appareil » |
| Envoi | Bulle optimiste avec horloge ; remplacée par l'heure + accusé |
| Échec | Bulle rouge douce + bouton « Réessayer » |
| Reconnexion | Bandeau fin, messages restent lisibles |
| Présence | Point vert 8 px, « en ligne » / « vu il y a … » |

## Interactions

- Entrée envoie ; Maj+Entrée retourne à la ligne.
- Appui long / clic sur une bulle → menu : réagir, copier (local), supprimer si auteur.
- Une réaction est un toggle ; une seule par personne et par message.
- Scroll : rester en bas si l'utilisateur y était ; sinon badge « nouveaux messages ».
- Accessibilité : focus visible, labels ARIA, navigation clavier, contraste AA.

## Ce qu'on ne fait pas en V2

- Pas de pièce jointe, d'appel, de groupe, de blocage ni de signalement.
- Pas de statut « en train d'écrire » si la Function est indisponible.
- Pas d'aperçu de lien qui ferait un appel réseau côté serveur.
