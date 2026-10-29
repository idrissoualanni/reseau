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
│ Sidebar      │  (avatar) Amina  ▾          🔒 E2E       │
│ app          ├──────────────────────────────────────────┤
│              │        fil centré (max 768 px)           │
│ Messages     │        reçu à gauche, envoyé à droite    │
│              │                                          │
│              ├──────────────────────────────────────────┤
│              │  [écrire…]                    😊  Envoyer│
└──────────────┴──────────────────────────────────────────┘
```

Le bouton « (avatar) Amina ▾ » ouvre le sélecteur :

```
┌──────────────────────────────┐
│ Messages                E2E  │
│ [Rechercher]                 │
│ DEMANDES DE CONTACT (1)      │
│ (avatar) Amina    ✓   ✕      │
│ ──────────────────────────── │
│ (avatar) Yann · il y a 2 h   │
│ (avatar) Sam  · Vous : salut │
│ ──────────────────────────── │
│ En attente : Léa             │
└──────────────────────────────┘
```

- Le fil occupe toute la largeur utile, texte limité à 768 px pour la lisibilité.
- Le menu déroulant fait 384 px max, hauteur 70 % de l'écran, recherche en tête.
- Les demandes reçues sont en haut avec un badge sur le bouton ; ✓ accepte,
  ✕ refuse. Les demandes envoyées apparaissent en pied de menu.

### Mobile

- Une seule colonne : le bouton de l'en-tête ouvre le même menu (pas de bouton
  retour séparé).
- En-tête compact, avatar 36 px.
- Composer fixe au-dessus du clavier (`env(safe-area-inset-bottom)`).

## Composants shadcn

`Sidebar` (navigation existante), `Bubble`, `Message`, `MessageScroller`,
`Skeleton`, `Button`, `Textarea`, `Avatar`, `Popover`, `Badge`.
Sélecteur emoji : `emoji-picker-react`, dans un `Popover` (composer) et une
surcouche pour les réactions.

## États

| État | Rendu |
|---|---|
| Chargement | `Skeleton` dans le menu + fil |
| Aucune conversation | « Aucune conversation » + lien « Trouver un profil » |
| Demande en attente | Bouton profil « Demande envoyée », texte « En attente d'acceptation. » |
| Demande reçue | Section dédiée en haut du menu, ✓ / ✕ labellisés |
| Clé absente | Carte d'activation E2E, bouton « Configurer sur cet appareil » |
| Envoi | Bulle optimiste avec horloge ; remplacée par l'heure + accusé |
| Échec | Bulle rouge douce + bouton « Réessayer » |
| Reconnexion | Bandeau fin, messages restent lisibles |
| Présence | Point vert 8 px, « en ligne » / « vu il y a … » |

## Interactions

- Entrée envoie ; Maj+Entrée retourne à la ligne.
- Le bouton 😊 insère l'emoji **à la position du curseur** et laisse le focus au
  champ ; Échap ou clic extérieur ferme le sélecteur.
- Appui long / clic sur une bulle → menu : réagir, copier (local), supprimer si auteur.
- Une réaction est un toggle ; une seule par personne et par message.
- Scroll : rester en bas si l'utilisateur y était ; sinon badge « nouveaux messages ».
- Accessibilité : focus visible, labels ARIA, navigation clavier, contraste AA,
  `aria-current` sur la conversation active, badge en texte lecteur d'écran.

## Ce qu'on ne fait pas en V2

- Pas de pièce jointe, d'appel, de groupe, de blocage ni de signalement.
- Pas de statut « en train d'écrire » si la Function est indisponible.
- Pas d'aperçu de lien qui ferait un appel réseau côté serveur.
