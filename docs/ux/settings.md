# Fiche UX — Paramètres

Écrite par `designer` **avant** le code de la page.

- **Route** : `/settings` · **Fonctionnalité(s)** : F40 · **Version** : V1.5
- **Utilisateur et objectif** : un membre veut régler l'apparence une fois, sans chercher
  une bascule dans chaque écran.
- **Action principale** : choisir entre **Clair**, **Sombre** et **Système** ; le changement
  est immédiat.

## Parcours

1. Menu utilisateur du sidebar (bas) → **Paramètres**.
2. L'écran s'ouvre sur la section **Apparence**.
3. Choix d'une carte → application immédiate, mémorisée dans le navigateur.
4. Sortie : navigation habituelle ; aucune redirection.

## Contenu et hiérarchie

1. `h1` **Paramètres** + une phrase.
2. `h2` **Apparence** + précision « enregistré dans ce navigateur ».
3. Trois cartes-options (icône, libellé, description) sur une ligne desktop, une colonne
   mobile.
4. Rien d'autre : les réglages de compte (F28) viendront plus tard.

## États

| État | Ce que voit l'utilisateur |
|---|---|
| Premier rendu | Aucune carte sélectionnée le temps de lire le thème stocké (pas de flash). |
| Sélection | Bordure et anneau violet, fond d'icône teinté. |
| Changement | Application immédiate, sans bouton « Enregistrer ». |
| Erreur | Sans objet (stockage local uniquement). |

## Mobile (360 px) puis desktop

- Mobile : une colonne, cartes pleine largeur, cible ≥ 44 px.
- Desktop : trois colonnes égales, largeur de contenu `PageShell` (640 px).

## Accessibilité

- `role="radiogroup"` + `aria-label="Thème de l'interface"` ; chaque carte `role="radio"`
  et `aria-checked`.
- Focus visible : anneau 3 px (`--ring`), ordre de tabulation gauche → droite.
- L'état ne repose jamais sur la couleur seule : bordure + anneau + fond d'icône.
- Textes contrastés (`muted-foreground` sur `card`, AA).

## Tokens et références

- Référence UI : `DESIGN.md` §15 (écran Paramètres) — structure, pas copie.
- Tokens : `--primary`, `--card`, `--border`, `--muted`, `--muted-foreground`,
  rayon 14 px, `shadow-card`, `180 ms ease-out`. Aucune valeur en dur.
- Contraste vérifié : oui (violet `#7C3AED` sur blanc, texte `#10203F`).

## Composants utilisés

- `PageShell` (fil).
- `AppearanceChoice` : nouvelle variante documentée dans `DESIGN.md` §6 (carte-radio
  construite avec un `button`, sans nouveau composant shadcn).

## Textes (français)

- Titre : **Paramètres**.
- Sous-titre : « Personnalise l'apparence de Réseau sur cet appareil. »
- Section : **Apparence** — « Le choix est enregistré dans ce navigateur. »
- Options : **Clair** / « Fond clair, texte foncé. » · **Sombre** / « Fond sombre, texte
  clair. » · **Système** / « Suit le réglage de l'appareil. »
