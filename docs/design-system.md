# Design system — journal d'implémentation

> **La référence UI/UX est `DESIGN.md`** (couleurs, typographie, composants, patterns,
> checklist). En cas de conflit, `DESIGN.md` gagne. Ce fichier ne décrit que l'état
> d'implémentation et l'historique des décisions.

## 1. Contexte

Réseau social modulable : le profil se construit sur des preuves (projets, compétences).
Communauté étudiante curieuse, mais le profil sert aussi au recrutement : l'identité doit
être **accueillante** et **crédible**. Mobile-first, réseau lent.

## 2. État actuel des tokens

| Sujet | Implémentation |
|---|---|
| Couleur primaire | Violet `#7C3AED` (sombre `#A78BFA`) — décision du 2026-10-29 |
| Accent de marque | Teal `#12A594` (sombre `#2DD4BF`), icônes et halos uniquement |
| Neutres | Surface `#F6F8FC`, texte `#10203F`, carte `#FFFFFF` |
| Succès / danger | `#2E9E5B` / `#D64545` ; variantes AA `success-strong` `#157347` et `danger-strong` `#B42323` |
| Rayon | `--radius: 0.875rem` (14 px), échelle 10 / 12 / 14 / 18 |
| Typographie | Inter (UI), Geist Mono (code) — variables `--font-inter` et `--font-geist-mono` |
| Ombres | `shadow-card` et `shadow-popover` (voir `DESIGN.md` §5) |
| Motion | `180 ms`, courbe `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Thème | Clair + sombre par classe (`next-themes`), `prefers-reduced-motion` respecté |
| Largeurs | `max-w-content` 640 px · `max-w-wide` 960 px · `max-w-admin` 1200 px |

Le bloc de tokens complet, prêt à copier, vit dans `DESIGN.md` §14 et dans
`src/app/globals.css`. **Ne pas dupliquer les valeurs ailleurs.**

## 3. Composants

- Primitifs : `src/components/ui/**` (shadcn/ui, `new-york`, base `neutral`, lucide).
- Maison : `PageShell`, `EmptyState`, `ErrorState`, `FormField`, `TextareaField`,
  `UsernameField`, `Avatar`, `SkillBadge`, `SkillsField`, `ProjectCard`, `PostCard`,
  `ImageUploader`, `GalleryUploader`, `ImageGallery`.
- Inventaire, variantes et états : `DESIGN.md` §6.
- **Absents** : `Dialog`, `AlertDialog`, `Toast`/`sonner`, `Alert`, `Table`. Ne pas les
  utiliser tant qu'ils ne sont pas ajoutés et documentés.

## 4. Historique

### Lot 0 — socle (2026-10-09)
- Tokens shadcn + Tailwind v4, thème clair/sombre, `FormField`, navigation haute/basse.
- Accent de l'époque : violet `oklch(0.541 0.281 293.009)` ; typographie Geist.
- Cibles tactiles `h-11`, largeurs 640/960.

### Lot 1 — auth (2026-10-09)
- `FormField` (label lié, `aria-invalid`, erreur `role="alert"`), `AuthFormSkeleton`.
- Cartes d'auth `max-w-sm` centrées, `h1` unique, **aucune top bar ni sidebar**.

### Lot 2 — profil (2026-10-09)
- `TextareaField`, `UsernameField`, `Avatar` (initiales), `SkillBadge`, `SkillsField`.
- `SkillBadge` : `declared` = `secondary`, `demonstrated` = succès + icône + libellé.

### Lot 3 — design system v2 (2026-10-29)
- **`DESIGN.md` créé** : source UI/UX opposable (14 sections + références par écran).
- Tokens alignés : surface `#F6F8FC`, texte `#10203F`, rayon 14 px, Inter, ombres
  `shadow-card`/`shadow-popover`, motion 180 ms, palette sombre dérivée.
- Primaire **conservée en violet** (décision utilisateur) ; le bleu `#2F66DB` d'`AGENTS.md`
  est remplacé.
- Tokens sémantiques AA ajoutés : `success-strong`, `danger-strong`, `brand`, `warning`, `info`.
- `Button`/`Input`/`Textarea`/`Select` : 44 px, rayon 14, transition 180 ms.
- `Badge` succès : `success-strong` + blanc (5,87:1) au lieu de `success` + blanc (3,41:1).
- Couleurs en dur purgées de `message-thread.tsx` ; `bubble.tsx` dérive déjà du primaire.
- Agents `designer`/`frontend` et rules `design-ui`/`frontend-ux` mis à jour
  (chemins `src/**` corrigés, `DESIGN.md` en tête de lecture).

## 5. Reste à faire

- Ajouter `dialog`, `alert-dialog`, `sonner`, `alert`, `table` si un écran en a besoin
  (ajout + mise à jour de `DESIGN.md` §6).
- Audit visuel 360 / 768 / 1024 px de chaque écran (checklist `DESIGN.md` §13).
- Vérifier les contrastes après tout nouveau composant.
