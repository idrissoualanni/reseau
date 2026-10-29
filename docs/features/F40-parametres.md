# F40 — Paramètres (apparence)

- **Version** : V1.5 · **Dépend de** : — · **Agents** : designer, frontend
- **Route** : `/settings` (fiche UX : `docs/ux/settings.md`)

## Objectif

Donner un endroit unique pour régler l'apparence de l'interface, au lieu d'une bascule
dans l'en-tête du sidebar.

## Contenu

- Section **Apparence** : trois choix — `light`, `dark`, `system`.
- Le choix est appliqué immédiatement et conservé dans le navigateur par `next-themes`
  (`localStorage`), sans donnée serveur.
- Le sidebar expose un lien **Paramètres** dans le menu utilisateur ; son en-tête porte
  l'icône de **repli/dépli** (et non plus la bascule de thème).

## Données

Aucune table. Préférence locale (`next-themes`), donc propre à chaque navigateur.

## Hors périmètre

- Modification de l'e-mail ou du mot de passe (F28).
- Langue, notifications, confidentialité par défaut (à spécifier).
- Synchronisation du thème entre appareils (nécessiterait un champ profil).

## Critères d'acceptation

1. `/settings` n'est accessible qu'aux membres connectés (layout `(app)`).
2. Cliquer une option change le thème sans rechargement.
3. L'option active est annoncée (`aria-checked`) et visible sans couleur seule.
4. Le choix survit à un rechargement du navigateur.
5. Aucune valeur de couleur en dur ; tokens `DESIGN.md` uniquement.
6. Le sidebar se replie/déplie via l'icône de l'en-tête, y compris en mode icônes.
