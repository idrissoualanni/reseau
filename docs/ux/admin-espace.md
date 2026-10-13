# Console d'admin d'espace — fiche UX

- **Route** : `/admin/spaces/[id]` (onglets **Détails · Membres · Accès**) ·
  **Fonctionnalité(s)** : F17 · **Version** : V1.5
- **Utilisateur et objectif** : un `space_admin` (ou l'admin plateforme) gère les membres
  et les méthodes d'accès de son espace.
- **Action principale** : approuver une demande en attente (onglet Membres).

## Parcours

1. `/admin/spaces` → choisi un espace → 2. onglet Détails (nom/description/visibilité) →
   3. onglet **Membres** : approuver / refuser / retirer, nommer `space_admin` →
   4. onglet **Accès** : activer/désactiver une méthode, (re)générer un code.

## Onglets

| Onglet | Contenu |
|---|---|
| Détails | formulaire existant (nom, description, visibilité) — inchangé |
| Membres | en attente (approuver/refuser), puis membres actifs (rôle, retirer) |
| Accès | liste des méthodes : `open`, `invite_code`, `invite_link`, `manual_approval` ; activer/désactiver ; générer/regénérer un code |

## États

| État | Ce que voit l'utilisateur |
|---|---|
| Chargement | squelette de liste |
| Vide membres | « Aucun membre pour l'instant. » |
| Vide en attente | « Aucune demande en attente. » |
| Erreur | message + « Réessayer » |
| Succès | la ligne change d'état (approuvé / retiré) |

## Autorisation

- Admin plateforme : voit tous les espaces.
- `space_admin` : ne voit que ses espaces (garde serveur `requireSpaceAdmin`).

## Tokens design

`primary #2F66DB`, `surface #F6F8FC`, `radius 14px`, `motion 180ms ease-out`. Composants
shadcn/ui existants (`Tabs`, `Table`/`Card`, `Badge`, `Button`, `Input`).
