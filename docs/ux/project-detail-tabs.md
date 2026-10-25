# Fiche UX — Détail projet avec onglets (`/projects/[id]`)

> Version V1.5 · Dépend de F18, F19, F20 · Composants : `ProjectTabs`, `ProjectReactions`, `ProjectComments`, `ProjectFollowers`, `ProjectActivity`

## 1. Objectif

Page de détail d'un projet publié enrichie de 4 onglets pour l'engagement social : **Aperçu** (contenu principal), **Activité** (mises à jour), **Discussion** (commentaires), **Suiveurs** (communauté).

## 2. Parcours utilisateur

### Aperçu (défaut)
1. Membre arrive sur `/projects/[id]` → onglet "Aperçu" actif
2. Voit : titre, auteur, date, description, compétences, couverture
3. Actions : Like, Suivre, Partager (toujours visibles hors onglets)

### Activité (F20)
1. Clic onglet "Activité"
2. Si auteur : composer visible (texte + image)
3. Liste updates chronologiques (plus récent en haut)
4. Chaque update : avatar auteur, date relative, texte, image, menu delete (si auteur)
5. Notification temps réel si follower (WebSocket)

### Discussion (F19)
1. Clic onglet "Discussion"
2. Formulaire commentaire en haut (si connecté)
3. Liste commentaires racine + réponses (indentation max 3 niveaux)
4. Actions : Répondre, Supprimer (si auteur), "Voir plus" si > 3 niveaux
5. Notification temps réel si follower

### Suiveurs (F19)
1. Clic onglet "Suiveurs"
2. Compteur + bouton Suivre/Ne plus suivre
2. Liste paginée avatars (displayName + @username)
3. Clic avatar → profil public

## 3. États de l'écran

| Onglet | État vide | Chargement | Erreur |
|--------|-----------|------------|--------|
| **Activité** | "Aucune mise à jour..." / "L'auteur n'a pas encore..." | Skeletons updates | Toast + retry |
| **Discussion** | "Aucun commentaire. Soyez le premier !" | Skeletons comments | Toast + retry |
| **Suiveurs** | "Aucun suiveur pour l'instant." | Skeletons avatars | Toast + retry |

## 4. Composants

### `ProjectTabs` (navigation principale)
- **Desktop** : `TabsList` 4 colonnes égales, `TabsTrigger` avec texte
- **Mobile (< md)** : `TabsList` scroll horizontal (`overflow-x-auto`), ou `Sheet`/drawer si espace insuffisant
- **État actif** : `data-[state=active]:bg-primary text-primary-foreground`
- **Accessibilité** : `role="tablist"`, `aria-selected`, `aria-controls`

### `ProjectReactions` (toujours visible, hors onglets)
- 4 boutons `Tooltip` : 👍 Like, 🎉 Célébrer, 💡 Instructif, 🤔 Curieux
- **État actif** : `variant="secondary"` + `fill-current` + `aria-pressed="true"`
- **Compteur** : badge `text-xs` à droite de l'icône
- **Toggle** : clic = add/remove (optimistic), disabled pendant mutation

### `ProjectComments` (onglet Discussion)
- **Composer** : `Textarea` (placeholder "Écrire un commentaire..."), max 1000 car., compteur, bouton "Commenter"
- **Thread** : racine + réponses indentées (`ml-8 border-l-2`)
- **Profondeur** : max 3 visuels, puis bouton "Voir les N réponses" (ouvre toutes)
- **Actions** : Répondre (ouvre `Textarea` inline), Supprimer (si auteur, confirmation)
- **Pagination** : curseur 20 par page, "Voir plus" si `hasNextPage`

### `ProjectFollowers` (onglet Suiveurs)
- **Header** : bouton Follow/Unfollow + compteur
- **Liste** : `ScrollArea` h-[300px], avatars + displayName/@username
- **Pagination** : curseur 20, "Voir plus"

### `ProjectActivity` (onglet Activité)
- **Composer** (si auteur) : bouton "Partager une mise à jour" → déplie `Textarea` + `ImageUploader` + actions
- **Liste updates** : carte par update (avatar, date relative, texte, image, delete si auteur)
- **Pagination** : curseur 20, "Voir plus"

## 5. Responsive

| Breakpoint | Onglets | Composer | Liste |
|------------|---------|----------|-------|
| `< 640px` | Scroll horizontal ou Sheet | Plein écran (Sheet) | 1 colonne, padding réduit |
| `640-1024px` | 4 colonnes fixes | Inline | 1 colonne |
| `≥ 1024px` | 4 colonnes fixes | Inline | 1 colonne |

## 6. WebSocket Notifications (temps réel)

### Événements
| Événement | Déclencheur | Payload | Cible |
|-----------|-------------|---------|-------|
| `project_update_created` | Auteur publie update | `{ projectId, updateId, authorId, preview }` | Followers du projet |
| `project_comment_created` | Membre commente | `{ projectId, commentId, authorId, preview }` | Followers du projet |
| `project_reaction_added` | Membre réagit | `{ projectId, type, count }` | Tous sur la page |

### Comportement client
- Connexion `wss://` via `NEXT_PUBLIC_SIGNALING_URL`
- Auth : JWT Neon Auth dans handshake
- Rooms : `project:{projectId}` (join à l'entrée, leave à la sortie)
- Reconnexion : exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Toast notification : `toast.info()` avec preview + lien vers onglet concerné

## 7. Design Tokens (AGENTS.md)

| Token | Usage |
|-------|-------|
| `color.primary` `#2F66DB` | Onglet actif, boutons primaires, liens |
| `color.accent` `#12A594` | Réaction "Instructif", badges succès |
| `color.surface` `#F6F8FC` | Fond cartes updates/comments, panneau composer |
| `radius` `14px` | Cards, boutons, inputs, TabsTrigger |
| `space` `8px` | Gap liste 16px, padding cards 16px |
| `shadow.card` | Cards updates, comments, followers |
| `motion` `180ms` | Hover reactions, transitions tabs, expand replies |

## 8. Accessibilité (WCAG 2.2 AA)

- **Tabs** : `aria-orientation="horizontal"`, clavier ←/→ navigation, Home/End
- **Focus** : visible sur tous triggers, composer, boutons actions
- **ARIA** : `aria-live="polite"` sur nouveaux comments/updates, `aria-expanded` sur réponses
- **Contraste** : textes sur fonds respectent AA (tokens)
- **Cibles** : ≥ 44px (boutons reactions, tabs, actions)

## 9. Cas d'erreur

| Cas | Message | Action |
|-----|---------|--------|
| Projet draft (non auteur) | 404 via `getVisibleProject` | `notFound()` |
| Commentaire > 1000 car. | "Texte trop long (1000 caractères maximum)." | Validation Zod + message sous champ |
| Réponse hors projet | "La réponse ne cible pas le bon projet." | `RuleViolationError` → toast |
| Image update invalide | "Image JPEG, PNG ou WebP de 5 Mo maximum." | Validation presign + toast |
| WebSocket déconnecté | "Connexion temps réel perdue. Reconnexion..." | Auto-retry + badge "Hors ligne" |

## 10. Hors périmètre V1.5

- Modération commentaires (signaler, masquer) — admin seulement V1.5
- Mentions @username dans commentaires (V2)
- Réactions personnalisées / emojis libres (V2)
- Planification updates (programmer publication) (V2)
- Commentaires sur updates (réutiliser project_comments ?) (V2)
- Analytics engagement (V2)