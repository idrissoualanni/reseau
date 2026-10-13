# Espaces — fiche UX (liste + adhésion)

- **Route** : `/spaces`, `/spaces/[slug]` · **Fonctionnalité(s)** : F14, F15 · **Version** : V1.5
- **Utilisateur et objectif** : un membre connecté cherche un espace (université, filière,
  thème) et le rejoint en moins de 30 secondes.
- **Action principale** : « Rejoindre » sur la page d'un espace.

## Parcours

1. Sidebar → « Espaces » (`/spaces`) → 2. choisit un espace → 3. `/spaces/[slug]` →
   4. « Rejoindre » (ou saisit un code / envoie une demande) → sortie : membre de l'espace
   (badge « Membre »), retour au fil de l'espace.

## Contenu et hiérarchie

1. Liste : titre, description courte, type (université / filière / thème), badge
   « Privé », nombre de membres, méthode d'accès dominante.
2. Détail : nom, description, type, visibilité, nombre de membres, liste des méthodes
   actives, bloc d'adhésion, liste des membres (avatars + nom + rôle).

## États

| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | squelettes de cartes d'espace |
| Vide | « Aucun espace public pour l'instant. » |
| Erreur | message + « Réessayer » |
| Succès | badge « Membre » / « Demande envoyée » (toast) |
| Hors connexion | redirection `/sign-in?next=…` |

## Adhésion par méthode

- `open` : bouton « Rejoindre » → membre immédiat.
- `invite_code` : champ « Code d'invitation » + bouton « Rejoindre ».
- `invite_link` : jeton lu dans l'URL (`?invite=…`) → bouton « Rejoindre ».
- `manual_approval` : bouton « Demander l'accès » → « Demande envoyée, en attente ».

## Contenu et hiérarchie (partagé)

Tokens design (AGENTS.md) : `primary #2F66DB`, `surface #F6F8FC`, `radius 14px`,
`motion 180ms ease-out`. Composants shadcn/ui existants uniquement (`Card`, `Button`,
`Input`, `Label`, `Badge`, `EmptyState`).

## Critères d'acceptation visuels

- [ ] L'action principale est visible sans défilement à 360 px.
- [ ] Chaque méthode d'accès a un état clair (membre / en attente / rejoindre).
- [ ] Les erreurs sont annoncées (`role="alert"`).
