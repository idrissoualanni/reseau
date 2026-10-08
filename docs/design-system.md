# Design system

Statut : **base neutre**. L'identité (couleur principale, nom, logo) reste à définir (`open-decisions.md`) ; tout passe par des **tokens**, donc la changer = modifier un seul fichier (`globals.css`).

## Principes
1. **Mobile d'abord** : concevoir à 360 px, puis élargir. Cible tactile ≥ 44 × 44 px.
2. **Léger** : peu de JavaScript client, images optimisées, pas de polices lourdes (police système ou une seule famille variable). Penser coût des données.
3. **Preuve au centre** : projets et compétences sont les éléments visuels forts du profil.
4. **Accessible** : contraste AA, focus visible, labels explicites, navigation clavier, `aria-*` corrects.
5. **Cohérent** : une seule source de composants (`components/ui`, shadcn), pas de variante locale.

## Tokens (variables CSS, convention shadcn)
`--background` `--foreground` `--card` `--muted` `--muted-foreground` `--border` `--ring` `--primary` `--primary-foreground` `--secondary` `--destructive` `--success` — clair et sombre.
- Rayon : `--radius: 0.5rem`.
- Espacement : échelle Tailwind (4 px). Largeur de contenu max 640 px (mobile/feed) · 960 px (pages denses).
- Typographie : 5 tailles (xs, sm, base, lg, xl–2xl), 2 graisses (400, 600).
- Niveaux de preuve : badges `declared` (neutre) · `demonstrated` (primaire) · `verifiable` (succès). Le sens ne repose jamais sur la couleur seule (icône + libellé).

## Composants de base (shadcn/ui)
Button, Input, Textarea, Label, Form, Select, Badge, Avatar, Card, Dialog, Sheet, Tabs, Skeleton, Toast (sonner), DropdownMenu, Command (autocomplétion de compétences).
Composants maison obligatoires : `PageShell`, `EmptyState`, `ErrorState`, `ProjectCard`, `ProfileHeader`, `SkillBadge`, `ImageUploader`.

## États obligatoires pour toute page/liste
Chargement (squelette) · vide (message + action) · erreur (message + réessayer) · succès · hors connexion (message clair).

## Formulaires
Validation Zod côté client **et** serveur · erreurs sous le champ · bouton désactivé pendant l'envoi · pas de perte de saisie sur erreur · messages en français, simples.

## Images
`next/image`, formats WebP/AVIF, largeur max 1600 px, `loading="lazy"`, texte alternatif obligatoire (titre du projet par défaut).

## Navigation V1
Barre basse sur mobile (Projets · Recherche · Mon profil), barre haute sur desktop. Pages : `/` (projets), `/search`, `/u/[username]`, `/projects/[id]`, `/me/profile`, `/me/projects`, `/sign-in`, `/sign-up`.

## Processus
`designer` maintient ce fichier. Tout nouveau composant : ajout ici + `components/ui` avant usage. `docs/ux/_template.md` fixe le format des fiches de page.
