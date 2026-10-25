# Fiche UX — Catalogue des projets (`/projects`)

> Version V1.5 · Dépend de F18 · Composants : `ProjectsCatalog`, `ProjectCard`, `ProjectFeed`

## 1. Objectif

Permettre à tout membre connecté de découvrir l'ensemble des projets publiés de la plateforme, avec des filtres combinables pour affiner la recherche.

## 2. Parcours utilisateur

1. Membre connecté accède à `/projects` (depuis la navigation ou lien direct)
2. Liste paginée des projets publiés s'affiche (grille responsive)
3. Membre utilise les filtres (compétences, type, auteur, recherche texte)
4. Résultats se mettent à jour (pagination conservée ou remise à zéro)
5. Membre clique sur un projet → redirection vers `/projects/[id]`

## 3. États de l'écran

| État | Description |
|------|-------------|
| **Chargement initial** | Skeletons `ProjectCard` (3-6 selon viewport) |
| **Liste vide** | `EmptyState` : icône Filter, titre "Aucun projet trouvé", description contextuelle, CTA "Créer un projet" si auteur |
| **Filtres actifs** | Badge compteur sur bouton "Filtres", panneau ouvert par défaut |
| **Chargement filtres** | `Loader2` sur bouton "Filtrer", transition douce |
| **Erreur** | Toast erreur + conservation des filtres saisis |

## 4. Composants

### `ProjectsCatalog` (conteneur principal)
- **Header** : titre "Catalogue des projets", description, bouton Filtres (avec badge count)
- **Panneau filtres** (collapse/expand) : 
  - Recherche texte (Input + icône Search, Enter pour soumettre)
  - Compétences (Select multiple, max 5, chargement depuis `/api/skills`)
  - Types de projet (Select multiple : Personnel, Équipe, Open Source, Recherche, Cours)
  - Auteur (Input username, validation format)
  - Boutons : "Filtrer" (primary), "Tout effacer" (ghost, visible si filtres actifs)
- **Résultats** : `ProjectFeed` avec `initialPage` du serveur
- **Pagination** : bouton "Voir plus" (outline, disabled pendant chargement)

### `ProjectCard` (réutilisé F07/F08)
- Couverture image ou placeholder `ImageIcon`
- Titre (lien vers détail), extrait (160 car.)
- Auteur (Avatar + displayName, lien vers profil)
- Date publication (relative)
- Compétences (max 3 badges + "+N")
- Hover : shadow elevée, transition 180ms

## 5. Responsive

| Breakpoint | Grille | Filtres | Panneau filtres |
|------------|--------|---------|-----------------|
| `< 640px` (mobile) | 1 colonne | Bouton "Filtres" ouvre drawer (Sheet) | Drawer plein écran bas |
| `640-1024px` (tablet) | 2 colonnes | Panneau inline au-dessus résultats | Collapsible, ouvert par défaut |
| `≥ 1024px` (desktop) | 3 colonnes | Panneau inline | Toujours visible |

## 6. Accessibilité (WCAG 2.2 AA)

- **Contraste** : tokens `color.text` sur `color.surface` (AA)
- **Focus visible** : `focus-visible:ring-2 focus-visible:ring-ring` sur tous interactifs
- **Labels** : `Label` associé à chaque `Input`/`Select` (`htmlFor`/`id`)
- **ARIA** : `aria-label` sur boutons icon-only, `role="group"` sur groupe filtres
- **Clavier** : Tab navigation顺序 logique, Enter soumet recherche
- **Screen reader** : `aria-live="polite"` sur compteur résultats, `aria-expanded` sur collapse

## 7. Design Tokens (AGENTS.md)

| Token | Valeur | Usage |
|-------|--------|-------|
| `color.primary` | `#2F66DB` | Bouton "Filtrer", liens, focus |
| `color.accent` | `#12A594` | Badge filtres actifs, accents |
| `color.surface` | `#F6F8FC` | Fond panneau filtres, cards |
| `color.text` | `#10203F` | Texte principal |
| `color.muted` | dérivé | Texte secondaire, placeholders |
| `radius` | `14px` | Cards, boutons, inputs, panneau |
| `space` | `8px` base | Gap grille 16px, padding 24px |
| `shadow.card` | douce | Cards projets, panneau filtres |
| `motion` | `180ms ease-out` | Hover cards, transitions collapse |

## 8. Données & Performance

- **Pagination** : curseur `(published_at, id)` — pas d'OFFSET
- **Filtres combinés** : AND entre tous (compétences = AND multiple)
- **Recherche** : trigramme `pg_trgm` sur `title || ' ' || body` (< 300ms cible)
- **Cache** : `initialPage` du serveur (SSR), filtres côté client → nouvelle requête
- **Skeletons** : 6 cards mobiles / 12 desktop pendant chargement initial

## 9. Cas d'erreur

| Cas | Message | Action |
|-----|---------|--------|
| Recherche vide | "Le terme de recherche ne peut pas être vide." | Empêcher soumission |
| Trop de compétences | "Maximum 5 compétences pour le filtre." | Limiter sélection |
| Auteur introuvable | "Membre introuvable." | Afficher dans toast |
| Erreur serveur | "Impossible de charger les projets. Réessaie." | Toast + retry |

## 10. Hors périmètre V1.5

- Tri par popularité / likes (F19)
- Filtrage par espace (F14/F15)
- Sauvegarde filtres / alertes email (V2+)
- Recherche géographique (V2+)