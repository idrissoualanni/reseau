# Fiche UX — Mises à jour de projet / Activity (`ProjectActivity`)

> Version V1.5 · Dépend de F20 · Composants : `ProjectActivity`, `ProjectUpdateCard`, `ImageUploader`

## 1. Objectif

Permettre à l'auteur d'un projet de partager son avancement (texte + image optionnelle) et aux followers d'être notifiés en temps réel. Crée un fil d'actualité chronologique du projet.

## 2. Parcours utilisateur

### Auteur du projet
1. Onglet "Activité" → voit bouton "Partager une mise à jour" (outline, pleine largeur)
2. Clic → déplie composer : `Textarea` (placeholder "Quelle est la progression de ton projet ?") + `ImageUploader`
3. Saisie texte (max 5000 car.) + optionnel image (drag/drop ou clic)
4. Aperçu image affiché (aspect vidéo, max-h-64, object-cover)
4. Clic "Publier la mise à jour" → optimistic update + mutation GraphQL
5. Update apparaît en haut de liste, composer se referme
6. Notification WebSocket envoyée aux followers

### Followers / Visiteurs
1. Onglet "Activité" → liste updates (plus récent en haut)
2. Pas de composer visible
3. Chaque update : avatar auteur, date relative, texte, image (si présente)
4. Notification toast temps réel à l'arrivée d'une nouvelle update
5. Clic toast → scroll vers update / focus onglet Activité

## 3. États de l'écran

| État | Description |
|------|-------------|
| **Composer fermé** | Bouton "Partager une mise à jour" (outline, w-full) |
| **Composer ouvert** | `Textarea` (min-h-[80px]), `ImageUploader`, actions Annuler / Publier |
| **Upload image** | `Loader2` sur zone drop, preview progressive, bouton ✕ retirer |
| **Publication** | `Loader2` sur bouton "Publier", disabled, optimistic update immédiat |
| **Liste vide (auteur)** | "Aucune mise à jour pour l'instant. Partage ta progression !" |
| **Liste vide (autres)** | "L'auteur n'a pas encore partagé de mise à jour." |
| **Erreur publication** | Toast "Échec de la publication. Réessaie." + composer reste ouvert |

## 4. Composants

### `ProjectActivity` (conteneur onglet)
- **Header** : conditionnel `isAuthor` → composer ou message vide
- **Liste** : `ProjectUpdateCard[]` dans `div.space-y-4`
- **Pagination** : `ProjectFeed` style "Voir plus" (curseur 20)

### `ProjectUpdateCard` (carte update)
```
┌─ Card bg-card border rounded-lg p-4 space-y-3 ────────────┐
│  ┌─ flex gap-3 ────────────────────────────────────────┐  │
│  │ Avatar (sm, mt-1)  │  ┌─ flex-1 ─────────────────┐  │  │
│  │                      │  │ flex items-center gap-2  │  │  │
│  │                      │  │ displayName (font-medium)│  │  │
│  │                      │  │ date relative (text-xs)  │  │  │
│  │                      │  │ [✕ Delete] si auteur     │  │  │
│  │                      │  └─────────────────────────┘  │  │
│  │                      │  p.text-sm whitespace-pre-wrap │  │
│  │                      │  [Image] si imageKey          │  │
│  └──────────────────────┴──────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```
- **Image** : `rounded-lg max-h-64 object-cover` (clic → zoom ? V1.5 non, V2+)
- **Delete** : `Button variant="ghost" size="icon"` + `X` icon rouge, confirmation native `confirm()`

### `ImageUploader` (réutilisé F12/F13)
- **Zone drop** : border dashed, clic → input file, aperçu si image sélectionnée
- **Validation** : JPEG/PNG/WebP ≤ 5 Mo, message erreur sous zone
- **Preview** : `aspect-video w-full max-w-md mx-auto object-cover rounded-lg`
- **Retrait** : bouton ✕ top-right sur preview
- **Bucket** : `projet` (public_read), clé `projects/{profileId}/updates/{uuid}.{ext}`

## 5. Responsive

| Breakpoint | Composer | Liste | Image |
|------------|----------|-------|-------|
| `< 640px` | Sheet plein écran (drawer bas) | 1 colonne, padding 12px | max-w-full |
| `≥ 640px` | Inline (border, p-4) | 1 colonne | max-h-64 |

## 6. Design Tokens (AGENTS.md)

| Token | Usage |
|-------|-------|
| `color.primary` `#2F66DB` | Bouton "Publier", focus Textarea, lien auteur |
| `color.accent` `#12A594` | Succès upload image, badge "Publié" |
| `color.surface` `#F6F8FC` | Fond composer, fond card update |
| `color.destructive` | Bouton delete, erreur validation |
| `radius` `14px` | Card, Textarea, Button, ImageUploader zone |
| `space` `8px` | Gap avatar/texte 12px, gap actions 8px |
| `shadow.card` | UpdateCard, Composer panel |
| `motion` `180ms` | Hover delete, transitions composer, image preview appear |

## 7. Accessibilité (WCAG 2.2 AA)

- **Composer** : `Textarea` avec `Label` associé (visuellement masqué `sr-only`), `aria-describedby` pour compteur/max
- **ImageUploader** : `role="region" aria-label="Upload d'image"`, input file `aria-hidden`, zone drop `tabindex=0` + clavier Enter/Space
- **Delete** : `Button` avec `aria-label="Supprimer cette mise à jour"`, confirmation native
- **Focus** : visible sur tous éléments interactifs, ordre logique Tab
- **Live region** : `aria-live="polite"` sur liste updates pour nouveaux éléments (WebSocket)

## 8. Règles métier (rappel F20)

1. **Auteur uniquement** : vérifié côté serveur (`findOwnedProjectById`)
2. **Contenu** : texte 1-5000 car. brut + 1 image optionnelle
3. **Visibilité** : projet `published` → public ; `draft` → auteur seul
4. **Notifications** : followers notifiés via WebSocket `project_update_created`
5. **Preuve** : updates **ne comptent PAS** pour niveau `demonstrated`
6. **Ordre** : décroissant `createdAt` (plus récent en haut)
7. **Suppression** : auteur seulement, pas de cascade notifications

## 9. Cas d'erreur

| Cas | Message | Action |
|-----|---------|--------|
| Texte vide + pas d'image | "Ajoute du texte ou une image." | Désactiver bouton Publier |
| Texte > 5000 car. | "Texte trop long (5000 caractères maximum)." | Compteur rouge, validation Zod |
| Image invalide | "Image JPEG, PNG ou WebP de 5 Mo maximum." | Erreur sous ImageUploader |
| Clé image hors préfixe | "Clé d'image invalide." | `RuleViolationError` → toast |
| Projet introuvable | "Projet introuvable." | 404 / `notFound()` |
| Non auteur | "Seul l'auteur peut publier une mise à jour." | `ForbiddenError` → toast |

## 10. WebSocket — `project_update_created`

```typescript
// Payload reçu par followers
{
  type: "project_update_created",
  projectId: "uuid",
  updateId: "uuid",
  authorId: "uuid",
  preview: "Premiers 100 caractères du texte...",
  hasImage: boolean,
  createdAt: "ISO8601"
}
```

**Comportement client** :
1. Toast `info` avec preview + bouton "Voir" → focus onglet Activité + scroll vers update
2. Si onglet Activité ouvert : insertion optimiste en haut de liste (sans duplicate)
3. Badge "Nouveau" sur onglet Activité si onglet non actif

## 11. Hors périmètre V1.5

- Updates collaboratives (plusieurs auteurs) — F21 Collaboration (V2)
- Planification updates (programmer publication) — V2
- Versioning / historique modifications update — V2
- Commentaires sur updates — V2
- Analytics engagement (vues, clics) — V2
- Zoom/recadrage image — V1.5+ (recadrage hors périmètre F12)