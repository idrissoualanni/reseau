# Fiche UX — Navigation globale (sidebar connecté)

Écrite par le designer **avant** le code. Le frontend ne code pas sans cette fiche.

- **Route** : toutes les routes protégées `(app)` · **Fonctionnalité(s)** : F07 (feed), F09
  (recherche), F11 (posts), F10 (profil) · **Version** : V1
- **Utilisateur et objectif** : un membre connecté navigate vers le fil des projets, ses
  posts, la recherche ou son profil, et se déconnecte — sans quitter la page.
- **Action principale** : trouver le lien **Posts** (aujourd'hui absent) en moins de
  30 secondes à n'importe quelle taille d'écran.

## Contexte (constaté, à corriger)
- `src/components/app-sidebar.tsx` utilise une liste locale **sans** `/posts`, désalignée de
  `src/components/navigation.ts` (`NAV_ITEMS`). → `NAV_ITEMS` devient la **source unique**.
- Le footer affiche un avatar statique « Membre / Connecté » + bouton de déconnexion.
  → Remplacé par un **dropdown utilisateur** (avatar réel, nom, email, liens).
- Pas d'**icône de repli** : ajouter `SidebarRail` (desktop) + `SidebarTrigger` (mobile).
- Aucune top bar sur les pages d'auth (`(auth)`), inchangé.

## Parcours
1. Arrivée : page connectée quelconque, sidebar visible (256 px déplié / 64 px replié).
2. Navigation : clic sur un item → route active, label + icône, `aria-current="page"`.
3. Sortie : dropdown utilisateur → « Mon profil » ou « Se déconnecter » (retour au `/sign-in`).

## Contenu et hiérarchie
1. **En-tête** : logo « Réseau » (lien `/`) + toggle de thème.
2. **Navigation** (groupe) : Projets `/` · Posts `/posts` · Recherche `/search` ·
   Mon profil `/me/profile`.
3. **Pied** : dropdown utilisateur (avatar + nom + chevron) → Mon profil, Déconnexion.

## États
| État | Ce que voit l'utilisateur |
|---|---|
| Repli (desktop) | sidebar à icônes (64 px), tooltip sur les items, `SidebarRail` visible |
| Déplié (desktop) | labels + icônes (256 px) |
| Mobile (<768 px) | sidebar en drawer (`Sheet`), `SidebarTrigger` dans la barre supérieure |
| Actif | item en surbrillance + `aria-current="page"` |
| Focus clavier | anneau `ring-2 ring-primary` (outline visible) |
| Déconnexion | action serveur `signOutAction`, redirection `/sign-in` |

## Mobile (360 px) puis desktop
- Mobile : pas de rail ; drawer plein écran/`Sheet`, déclenché par `SidebarTrigger` en
  haut à gauche (barre 48 px). Zones tactiles ≥ 44 px.
- Desktop : rail 1 px sur le bord droit du sidebar, bouton flèche/chevron pour replier.

## Accessibilité
- `SidebarMenuButton` + `asChild` avec `<Link>` : l'item entier est un lien.
- Dropdown : `DropdownMenuTrigger` avec `aria-haspopup="menu"`, navigation flèches,
  `aria-expanded` géré par Radix, fermeture par `Échap`.
- Contraste ≥ 4.5:1 (texte `#10203F` sur surface `#F6F8FC`).

## Composants utilisés
- `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`,
  `SidebarMenuButton`, `SidebarMenuItem`, `SidebarFooter`, `SidebarRail`,
  `SidebarTrigger` (shadcn/ui, `src/components/ui/sidebar.tsx`).
- `DropdownMenu` (shadcn/ui, **nouveau** : `src/components/ui/dropdown-menu.tsx`, Radix).
- `Avatar` (existant), `ThemeToggle` (existant).

## Tokens design (AGENTS.md)
`color.primary #2F66DB` (actif/focus) · `color.surface #F6F8FC` (fond sidebar) ·
`color.text #10203F` · `radius 14px` · `shadow.card` douce · motion `180ms ease-out` ·
espace 4/8/16/24 · police Inter/system-ui.

## Textes (français)
- Items : Projets / Posts / Recherche / Mon profil.
- Dropdown : « Mon profil », « Se déconnecter ».
- Alt avatar : `Avatar de {nom}`.

## Critères d'acceptation
1. Le lien **Posts** est visible et mène à `/posts`.
2. Le rail replie/déplie le sidebar desktop ; le drawer mobile fonctionne.
3. Le dropdown montre nom + email réels et permet profil/déconnexion.
4. Aucune top bar sur `sign-in` / `sign-up` (régression interdite).
5. Lint, tests et typecheck passent.