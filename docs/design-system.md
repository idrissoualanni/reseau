# Design system — phase 1

> Cadre validé le 08/10/2026 (brainstorm, docs/brainstorming.md). Le détail — accent,
> typographies, composants — est finalisé par l'agent frontend (skill `frontend-design`)
> **dans la limite de ce cadre**. Ce document est la référence : tout écart se justifie ici.

## 1. Contexte

Réseau social modulable, phase 1 (docs/phases.md) : inscription/connexion, profil étudiant
minimal, publication d'activités. Communauté étudiante curieuse, mais le profil sert aussi
au recrutement : l'identité doit être **accueillante** et **crédible**.

## 2. Décisions validées

| Sujet | Décision |
|---|---|
| Personnalité | **Épuré moderne** — sobre, chaleureux sans être enfantin (repères : Instagram, Vercel, Linear) |
| Thème | **Clair + sombre** — `prefers-color-scheme` + bascule manuelle |
| Couleur d'accent | À finaliser par l'agent frontend (direction probable : indigo/violet) |
| Approche | **Tailwind CSS v4 + shadcn/ui** (Radix UI) — tokens = variables CSS |
| Périphérique | Mobile-first · réseau lent · petits écrans |

## 3. Tokens (variables CSS, Tailwind v4)

- **Couleurs sémantiques** : `background`, `foreground`, `card`, `primary`, `primary-foreground`,
  `secondary`, `muted`, `muted-foreground`, `border`, `input`, `danger`, `success`, `ring`.
  Chaque couleur existe dans les deux thèmes (clair/sombre) avec un contraste **AA**.
- **Rayon** : échelle courte (petit/moyen/plein) — cohérente composants ↔ cartes.
- **Espacement** : échelle base 4 px (`0.25rem` → multiples).
- **Ombres** : douces et discrètes (cartes, menus).
- **Typographie** : paire lisible UI + titres (choix final par l'agent frontend ; UI ≥ 14 px,
  hauteur de ligne confortable, hiérarchie claire).
- **Motion** : courte (≤ 200 ms), uniquement décorative, `prefers-reduced-motion` respecté.
- Largeur de contenu max 640 px (mobile/feed) · 960 px (pages denses).

## 4. Composants phase 1

Bouton (primaire / secondaire / ghost / danger, avec états focus/hover/disabled)
· champ de formulaire (label, message d'erreur, état invalid)
· carte d'activité (auteur, date, contenu, pastilles)
· navigation (top desktop, bottom mobile)
· avatar (avec initiales en secours)
· pastille de compétence (petite, discrète)
· états vides et chargement (skeleton)
· notification (toast)

Composants maison obligatoires : `PageShell`, `EmptyState`, `ErrorState`, `ProjectCard`,
`ProfileHeader`, `SkillBadge`, `ImageUploader`.

Hors périmètre phase 1 : messagerie, appels, fil de réseau, CV — rien d'UI ne les anticipe.

## 5. Règles produit

1. **Réseau lent** : skeleton au chargement, lazy loading, JS client minimal, aucune
   animation bloquante.
2. **Accessibilité AA** dans les deux thèmes : contrastes vérifiés, focus visible,
   libellés associés aux champs, cibles tactiles ≥ 44 px.
3. **Cœur générique** : aucun composant ni style spécifique « étudiant » dans le core —
   le module `etudiant` (champs profil) reste isolé, conformément à la règle profils-modulaires.
4. État de chargement et erreurs toujours prévus (réseau lent) : jamais d'écran blanc.
5. Le sens d'un badge ne repose jamais sur la couleur seule (icône + libellé).
6. Formulaires : validation Zod côté client **et** serveur · erreurs sous le champ ·
   bouton désactivé pendant l'envoi · pas de perte de saisie sur erreur · messages en
   français, simples.

## 6. Navigation V1

Barre basse sur mobile (Projets · Recherche · Mon profil), barre haute sur desktop.
Pages : `/` (projets), `/search`, `/u/[username]`, `/projects/[id]`, `/me/profile`,
`/me/projects`, `/sign-in`, `/sign-up`.

## 7. Critères de réussite

- L'app scaffold (page de base) est remplacée par une UI aux tokens du design system,
  thème clair + sombre fonctionnel, mobile-first.
- Les composants phase 1 existent (au moins bouton, champ, carte, navigation) et passent
  un contrôle d'accessibilité de base (contrastes, focus, labels).
- `npm run build` + `npm run lint` verts sur la branche `frontend`.
- Rien de spécifique étudiant dans le core ; le module etudiant est dans son propre dossier.

## 8. Répartition

L'agent frontend implémente ce cadre (tokens + composants) et tranche le détail :
accent exact, typographies, variantes de composants. Toute décision notable est consignée
ici (section « Notes ») pour être visible.

### Notes
- (à compléter par l'agent frontend au fil des choix)