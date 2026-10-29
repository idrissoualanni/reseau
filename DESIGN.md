# DESIGN.md — Réseau

> **Lu avant chaque écran.** Ce fichier est la référence UI/UX du projet. Ordre de priorité :
> `DESIGN.md` > `docs/design-system.md` (journal d'implémentation) > `docs/ux/<page>.md` (parcours).
> En cas de conflit, `DESIGN.md` gagne. Toute exception exige un ADR dans `docs/decisions/`
> **et** une mise à jour de ce fichier.

## 0. Contexte

| Élément | Valeur |
|---|---|
| Produit | Réseau — réseau social où le profil se construit sur des preuves (projets, compétences) |
| Utilisateurs | Étudiants et jeunes actifs, 18–30 ans, mobile en priorité, connexion parfois lente |
| Actions clés | Publier un post/projet, consulter le fil, compléter son profil, rechercher, échanger |
| Personnalité | Sobre, crédible, chaleureux, moderne, rassurant |
| Références | Linear (densité, typographie), Read.cv (profil), Instagram (rythme du fil), Signal (messages), Vercel (console admin), Clerk (auth) |
| À éviter | Style générique de template, surcharge visuelle, dégradés décoratifs, couleurs agressives, emojis en guise d'icônes |
| Stack | Next.js App Router · Tailwind CSS v4 · shadcn/ui (`new-york`, base `neutral`) · lucide-react |
| Marché | Français, Afrique de l'Ouest ; paiement mobile money hors périmètre UI actuel |
| Contraintes | Thème clair **et** sombre · mobile 360 px · réseau lent · logo textuel « Réseau » · Turnstile en attente (ne doit pas bloquer) |

**Décision du 2026-10-29** : le violet actuel reste la couleur primaire (le bleu `#2F66DB`
d'`AGENTS.md` est remplacé). Les neutres, le rayon 14 px, Inter et la surface `#F6F8FC`
viennent des tokens designer d'`AGENTS.md`.

## 1. Principes de design

1. **Une seule action primaire par écran.** Tout le reste est secondaire, outline ou ghost.
2. **La preuve avant la décoration.** Un profil montre des projets et des compétences réelles ;
   aucun badge, compteur ou visuel ne suggère une preuve absente.
3. **Mobile 360 px d'abord.** Une colonne, aucun défilement horizontal, cibles ≥ 44 px.
4. **Le calme visuel.** Une seule couleur saturée par écran (le violet). Le teal est un accent
   rare, jamais une grande surface.
5. **Aucun état sans issue.** Chargement, vide, erreur, hors connexion et succès sont prévus ;
   jamais d'écran blanc ni de spinner sans texte.
6. **Le mouvement confirme, il ne distrait pas.** 180 ms maximum, jamais bloquant,
   `prefers-reduced-motion` respecté.

## 2. Couleurs

### 2.1 Thème clair

| Rôle | Token CSS | HEX | Usage précis |
|---|---|---|---|
| Fond de page | `--background` | `#F6F8FC` | Toutes les pages, fond du sidebar |
| Texte principal | `--foreground` | `#10203F` | Titres, corps, labels |
| Surface carte | `--card` | `#FFFFFF` | Cartes, panneaux, champs |
| Primaire | `--primary` | `#7C3AED` | CTA, lien actif, focus, `aria-current` |
| Texte sur primaire | `--primary-foreground` | `#FFFFFF` | Bouton primaire (5,70:1) |
| Primaire survol | `--primary-hover` | `#6D28D9` | `:hover` des CTA |
| Primaire actif | `--primary-active` | `#5B21B6` | `:active` |
| Secondaire | `--secondary` | `#EEF1F8` | Bouton secondaire, item de nav actif |
| Texte secondaire | `--secondary-foreground` | `#10203F` | Texte sur secondaire |
| Surface discrète | `--muted` | `#EEF1F8` | Blocs d'information, skeletons |
| Texte discret | `--muted-foreground` | `#5B6B8A` | Légendes, aides (5,05:1 sur surface) |
| Survol shadcn | `--accent` | `#EEF1F8` | **Survol uniquement**, jamais une marque |
| Accent de marque | `--brand` | `#12A594` | Icônes, halos, rares mises en avant |
| Succès | `--success` | `#2E9E5B` | Icônes de succès uniquement |
| Succès fort | `--success-strong` | `#157347` | Badge/texte de succès (blanc 5,87:1) |
| Danger | `--destructive` | `#DC2626` | Bouton destructif (blanc 4,83:1) |
| Danger fort | `--danger-strong` | `#B42323` | Texte de danger sur fond clair (6,55:1) |
| Alerte | `--warning` | `#B45309` | Bandeau d'alerte (blanc 5,02:1) |
| Info | `--info` | `#0B6BCB` | Bandeau d'information (blanc 5,28:1) |
| Bordure | `--border` | `#E2E8F4` | Cartes, séparateurs |
| Bordure de champ | `--input` | `#D7DFEE` | Champs au repos |
| Anneau de focus | `--ring` | `#7C3AED` | `focus-visible` |

### 2.2 Thème sombre

| Rôle | Token | Valeur |
|---|---|---|
| Fond | `--background` | `#0B1220` |
| Texte | `--foreground` | `#E8EEF9` (16,07:1) |
| Carte | `--card` | `#131C2E` |
| Primaire | `--primary` | `#A78BFA`, texte `#10203F` (5,93:1) |
| Texte discret | `--muted-foreground` | `#A5B4CE` (8,93:1) |
| Accent de marque | `--brand` | `#2DD4BF`, texte `#10203F` |
| Succès / danger | `--success` / `--destructive` | `#4ADE80` / `#F87171`, texte `#10203F` |
| Bordure | `--border` | `#26324A` |

### 2.3 Règles d'usage

- **Violet** = action et navigation active. Jamais pour un statut.
- **Teal** : icônes, illustrations, un seul détail par écran. **Interdit en texte sur fond blanc**
  (3,07:1) ; sur teal plein, texte `#10203F` (5,26:1).
- **Succès** : `bg-success-strong text-white` pour un badge ; `text-success` réservé aux icônes.
  `bg-success` + texte blanc est **interdit** (3,41:1).
- **Danger** : `--danger-strong` pour le texte et les petits badges ; `--destructive` pour les boutons.
- **Un statut ne repose jamais sur la couleur seule** : icône + libellé (« Publié », « Brouillon »).
- Contraste minimum : 4,5:1 texte normal, 3:1 grand texte (≥ 24 px ou 18,66 px gras) et icônes.
- Aucune couleur hors de ces tokens, aucun `rgba()`/`oklch()`/HEX dans un composant.

## 3. Typographie

**Police** : Inter (Google Fonts via `next/font`), variable `--font-inter`, `display: swap`.
Repli : `ui-sans-serif, system-ui, sans-serif`. Code : Geist Mono.

| Rôle | Taille / interligne | Classe cible | Graisse | Usage |
|---|---|---|---|---|
| Display | 32 / 40 px | `text-[2rem] leading-10` | 700 | Accueil marketing, chiffre clé (rare) |
| H1 | 28 / 36 px | `text-[1.75rem] leading-9` | 600–700 | Titre de page, **un seul `h1`** |
| H2 | 22 / 28 px | `text-[1.375rem] leading-7` | 600 | Section |
| H3 | 18 / 24 px | `text-lg leading-6` | 600 | Sous-section, titre de carte |
| Corps | 16 / 24 px | `text-base leading-6` | 400 | Texte courant, champs (mobile) |
| Petit | 14 / 20 px | `text-sm leading-5` | 400–500 | Métadonnées, labels, navigation |
| Légende | 12 / 16 px | `text-xs leading-4` | 400–500 | Badges, horodatage, aide |

- Graisses autorisées : 400, 500, 600, 700. Jamais 300 ni 800.
- Interlettrage : `-0.02em` sur les tailles ≥ 22 px, `0` en dessous.
- Longueur de ligne : **68 caractères max** (~640 px). Un paragraphe ne dépasse jamais `max-w-content`.
- Chiffres de compteurs : `tabular-nums`.
- Pas de texte justifié, pas de majuscules sur plus de 3 mots (sauf badges courts).

## 4. Espacements et grille

- Échelle : **4, 8, 12, 16, 24, 32, 48, 64 px** (`1, 2, 3, 4, 6, 8, 12, 16` en Tailwind).
- Marges de page : **16 px** (mobile) · **24 px** (≥ 768 px) · **32 px** (≥ 1024 px).
- Padding de carte : **24 px** (`p-6`), **16 px** sur mobile (`p-4`).
- Écart entre champs : **16 px** ; entre sections : **32 px** ; entre cartes de liste : **16 px**.
- Largeurs maximales : fil **640 px** (`max-w-content`), pages denses **960 px** (`max-w-wide`),
  console admin **1200 px** (`max-w-admin`).
- Breakpoints : base **375 px**, `md` **768 px**, `lg` **1024 px**, `xl` **1280 px**.
- Grilles : fil 1 colonne ; catalogue 1 / 2 / 3 colonnes à 375 / 768 / 1024 ; admin
  `sidebar 256 px + contenu fluide`.
- Aucun `margin` négatif, aucun `translate` pour compenser un espacement.

## 5. Forme et profondeur

| Élément | Valeur |
|---|---|
| Rayon par défaut | **14 px** (`--radius`, `rounded-lg`) |
| Petit rayon | 10 px (`rounded-sm`) · moyen 12 px (`rounded-md`) · grand 18 px (`rounded-xl`) |
| Pastille | `rounded-full` |
| Bordure | 1 px `--border` ; champ : 1 px `--input` |
| Ombre carte | `shadow-card` = `0 1px 2px rgba(16,32,63,.04), 0 8px 24px -12px rgba(16,32,63,.12)` |
| Ombre flottante | `shadow-popover` = `0 12px 32px -12px rgba(16,32,63,.24)` |
| Élévations | 0 plat · 1 carte · 2 popover/dropdown · 3 modale/sheet |

Interdits : ombres internes, glassmorphism, dégradés sur les surfaces, bordures de 2 px
(décoration), effet néon.

## 6. Composants

Chaque composant existe dans `src/components/ui/` ou `src/components/`. **Aucune variante
locale** : elle s'ajoute ici d'abord.

| Composant | Variantes | Tailles | États obligatoires |
|---|---|---|---|
| `Button` | `default` (primaire), `secondary`, `outline`, `ghost`, `destructive`, `link` | `sm` 36 · `md` 44 · `lg` 48 · `icon` 44 | repos, hover, active, focus-visible (anneau 3 px), disabled (opacité 50), chargement (`aria-busy`, spinner, libellé conservé) |
| `Input` | texte, email, password, recherche | 44 px | repos, hover, focus, `aria-invalid`, disabled, readOnly |
| `Textarea` | — | min. 112 px | idem `Input` |
| `Select` | simple, multiple | 44 px | repos, ouvert, focus, disabled |
| `Card` | standard, interactive (lien), discrète | padding 24 | repos, hover (interactive), focus |
| `Badge` | `default`, `secondary`, `success`, `outline`, `destructive`, `ghost` | 24 px | statique ; jamais couleur seule |
| `Avatar` | image, initiales | 24 / 32 / 40 / 64 / 96 | chargement (initiales), erreur image (initiales) |
| `Sidebar` | déployé 256 / replié 64 / drawer mobile | — | actif, focus, replié, ouvert |
| `Tabs` | — | 44 px | actif (soulignement 2 px violet), focus, disabled |
| `DropdownMenu` | — | item 40 | ouvert, focus, disabled |
| `Tooltip` | — | 12 px | délai 300 ms, jamais porteur d'une information vitale |
| `Skeleton` | texte, carte, avatar | — | animation 1,6 s, dimensions identiques au contenu |
| `EmptyState` | — | — | icône 24, titre, une phrase, une action |
| `ErrorState` | — | — | cause, action « Réessayer » |
| `PageShell` | fil, dense | 640 / 960 | en-tête, contenu, marges |
| Sélecteur d'apparence | trois cartes-radio (Clair/Sombre/Système) | 44 px min | actif (bordure + anneau), hover, focus-visible, `aria-checked` |
| `ProjectCard` | catalogue, profil | — | hover, focus, brouillon |
| `PostCard` | fil, détail | — | hover, focus, actions |
| `FormField` / `TextareaField` | — | — | label, aide, erreur `role="alert"` |
| `SkillBadge` | déclarée, démontrée | — | icône + libellé lecteur d'écran |
| `ImageUploader` / `GalleryUploader` | avatar, couverture, post, projet | — | vide, aperçu, envoi, erreur, retrait |
| `MessageBubble` | reçu, envoyé, système | — | envoi, échec, chiffré |

**Absents du dépôt — ne pas improviser** : `Dialog`, `AlertDialog`, `Toast`/`sonner`,
`Alert`, `Table`. Toute confirmation destructive reste une page ou un bloc inline avec le nom
exact de l'objet. Leur ajout passe par shadcn + mise à jour de ce fichier (TODO).

## 7. Patterns d'interface

- **Formulaires** : label au-dessus, champ 44 px, aide en 12 px, erreur **sous le champ**
  (`role="alert"`, icône + texte). Validation Zod client **et** serveur, au blur et à la
  soumission. Jamais vider la saisie. Bouton désactivé + libellé « Enregistrement… » pendant
  l'envoi. Un seul message d'erreur global en haut si plusieurs champs.
- **États vides** : icône 24, titre court, une phrase utile, **une** action. Exemple :
  « Aucun projet publié. Publie ton premier projet pour le montrer. » + « Créer un projet ».
- **Chargement** : squelette identique à la mise en page finale (pas de spinner plein écran).
  Un bouton en chargement garde sa largeur. Au-delà de 10 s : message + « Réessayer ».
- **Erreurs** : dire ce qui s'est passé, ce que l'utilisateur peut faire, proposer « Réessayer ».
  Jamais de code technique, de stack trace ni de « Une erreur est survenue » seul.
- **Actions destructrices** : nommer l'objet (« Supprimer « Mon projet » ? »), conséquence
  explicite, bouton danger à droite, « Annuler » au focus, jamais de suppression au premier clic.
- **Navigation mobile** : sidebar en drawer (`Sheet`), déclencheur 44 px en haut à gauche,
  fermeture par overlay/Échap, item actif avec `aria-current="page"`.
- **Commentaires** : indentation 16 px, **3 niveaux maximum**, ligne de rappel discrète ;
  au-delà, lien « Voir la réponse ».
- **Hors connexion** : bandeau non bloquant, saisie conservée, action réessayée manuellement.

## 8. Ton et microcopie

- **Tutoiement**, phrases courtes (≤ 20 mots), présent, voix active.
- Vocabulaire : « projet », « post », « profil », « compétence », « publier », « enregistrer ».
- À bannir : « utilisateur », « soumettre », « valider » (seul), « erreur », « échec », « Oups »,
  « Veuillez », « invalid », jargon technique, anglicismes inutiles.
- Boutons = verbe + objet : « Publier le post », « Enregistrer les modifications »,
  « Supprimer le projet », « Réessayer ».
- Erreurs : cause + solution. Exemples :
  - « Cet e-mail est déjà utilisé. Connecte-toi ou utilise une autre adresse. »
  - « Le fichier dépasse 5 Mo. Choisis une image plus légère. »
  - « Pas de connexion. Vérifie ton réseau puis réessaie. »
- Succès : confirmation courte et factuelle. « Projet publié. », « Modifications enregistrées. »

## 9. Iconographie et images

- **Icônes** : `lucide-react` uniquement, trait 1,75, tailles **16 / 20 / 24 / 32 px**.
  Une icône seule = `aria-label` + `Tooltip` (sauf action évidente dans un champ).
- Jamais d'emoji comme icône fonctionnelle ni d'icône décorative sans `aria-hidden`.
- **Images** : `next/image` obligatoire, formats servis WebP/AVIF, `sizes` renseigné.
  - Avatar : 1:1, 96–400 px, ≤ 2 Mo.
  - Couverture de projet : 16:9, ≥ 1200 px de large, ≤ 5 Mo.
  - Image de post : 4:5 à 16:9, ≤ 5 Mo, max 5 par galerie.
  - `alt` descriptif obligatoire ; `alt=""` si purement décoratif.
  - Jamais de texte incrusté dans une image (illisible et non traduisible).
  - `priority` seulement pour l'image LCP ; le reste en `lazy`.

## 10. Mouvement

| Usage | Durée | Courbe |
|---|---|---|
| Survol, focus, changement de couleur | 120 ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Bouton, onglet, dropdown | 180 ms | idem |
| Sheet, drawer, modale | 240 ms | idem |
| Skeleton | 1,6 s en boucle | `ease-in-out` |

- On anime **opacité et transform** uniquement.
- N'animent pas : la mise en page, les images au scroll, les carrousels automatiques.
- Pas de rebond, pas de parallaxe, pas de lecture automatique avec son.
- `prefers-reduced-motion: reduce` → transitions ≈ 0 ms (déjà global dans `globals.css`).

## 11. Accessibilité et performance

- Cible tactile **≥ 44 × 44 px**, y compris les icônes et la navigation.
- Focus visible : anneau `3 px` `--ring/50` + bordure `--ring`. **Jamais** `outline-none` sans anneau.
- Un seul `h1` par page ; hiérarchie `h2`/`h3` sans saut.
- Labels liés (`htmlFor`/`id`), `autocomplete` sur les champs d'identité, `aria-invalid`,
  `aria-describedby` pour l'aide et l'erreur, `aria-live="polite"` pour les messages asynchrones.
- Navigation clavier complète, ordre logique, `Échap` ferme les surfaces flottantes.
- Contrastes : voir §2, vérifiés à chaque nouvelle paire.
- Un lien d'évitement « Aller au contenu » sur les pages connectées.
- **Budget réseau** : police unique + mono, aucune bibliothèque UI lourde, JS de route ≤ 300 Ko
  gzip (cible), image ≤ 200 Ko, LCP ≤ 2,5 s en 4G lente, aucun blocage au premier rendu.
- Trois états à simuler avant livraison : 360 px, 1024 px, connexion lente.

## 12. Interdits

1. Style inline (`style={{ color }}`), HEX/RGB/oklch dans un composant ou une page.
2. Couleur, espacement ou taille hors tokens (pas de `text-[#…]`, `p-[13px]`, `bg-blue-500`).
3. Nouvelle police, nouvelle bibliothèque d'icônes, nouveau composant UI primitif.
4. Recréer un composant qui existe dans `components/ui` ou `components/`.
5. Modifier un primitif shadcn sans mettre à jour ce fichier.
6. Dégradés décoratifs, glassmorphism, ombres internes, effet néon.
7. Couleur seule pour porter un statut, une erreur ou une sélection.
8. Texte < 12 px, cible < 44 px, `outline-none` sans anneau visible.
9. Emoji comme icône, texte en majuscules longues, texte justifié.
10. « Une erreur est survenue », « Oups », message technique ou code HTTP affiché.
11. Suppression sans confirmation nommée, toast improvisé, modale improvisée.
12. `!important`, `margin` négatif, `absolute` pour corriger un flux.
13. Anglais dans l'interface, lorem ipsum, contenu factice présenté comme réel.
14. Chemin `apps/web/**` : le code vit dans `src/**`.

## 13. Checklist avant de déclarer un écran terminé

- [ ] `h1` unique, hiérarchie de titres correcte, titre dans l'onglet.
- [ ] Aucune valeur de couleur/espacement en dur (grep `#`, `rgb(`, `oklch(`).
- [ ] Les 5 états existent : chargement, vide, erreur, succès, hors connexion.
- [ ] Tous les champs ont un label lié, une aide et une erreur sous le champ.
- [ ] Bouton primaire unique ; libellés = verbe + objet, en français, tutoiement.
- [ ] Cibles ≥ 44 px ; focus visible au clavier ; `Échap` ferme les surfaces flottantes.
- [ ] Contrastes AA vérifiés (texte, icônes, badges) dans les deux thèmes.
- [ ] Statuts : icône + libellé, jamais la couleur seule.
- [ ] Testé à 360 px, 768 px et 1024 px, sans défilement horizontal.
- [ ] Squelettes au chargement ; aucune image sans `alt`, `sizes` et dimensions.
- [ ] Aucune nouvelle primitive ni variante locale ; fiche `docs/ux` à jour.
- [ ] `lint`, `typecheck` et `build` exécutés (ou échec déclaré explicitement).

## 14. Tokens prêts à copier

Bloc de référence de `src/app/globals.css` (Tailwind v4). **`--accent` est le survol shadcn ;
l'accent de marque est `--brand`.**

```css
:root {
  --radius: 0.875rem; /* 14px */

  --background: #f6f8fc;
  --foreground: #10203f;
  --card: #ffffff;
  --card-foreground: #10203f;
  --popover: #ffffff;
  --popover-foreground: #10203f;

  --primary: #7c3aed;
  --primary-foreground: #ffffff;
  --primary-hover: #6d28d9;
  --primary-active: #5b21b6;

  --secondary: #eef1f8;
  --secondary-foreground: #10203f;
  --muted: #eef1f8;
  --muted-foreground: #5b6b8a;
  --accent: #eef1f8;
  --accent-foreground: #10203f;
  --brand: #12a594;
  --brand-foreground: #10203f;

  --destructive: #dc2626;
  --destructive-foreground: #ffffff;
  --danger-strong: #b42323;
  --success: #2e9e5b;
  --success-strong: #157347;
  --success-foreground: #ffffff;
  --warning: #b45309;
  --info: #0b6bcb;

  --border: #e2e8f4;
  --input: #d7dfee;
  --ring: #7c3aed;

  --elevation-card: 0 1px 2px rgb(16 32 63 / 0.04), 0 8px 24px -12px rgb(16 32 63 / 0.12);
  --elevation-popover: 0 12px 32px -12px rgb(16 32 63 / 0.24);
  --motion-base: 180ms;
  --ease-brand: cubic-bezier(0.2, 0.8, 0.2, 1);
}

.dark {
  --background: #0b1220;
  --foreground: #e8eef9;
  --card: #131c2e;
  --card-foreground: #e8eef9;
  --popover: #131c2e;
  --popover-foreground: #e8eef9;

  --primary: #a78bfa;
  --primary-foreground: #10203f;
  --primary-hover: #bba4fb;
  --primary-active: #c9b6fc;

  --secondary: #1b263c;
  --secondary-foreground: #e8eef9;
  --muted: #1b263c;
  --muted-foreground: #a5b4ce;
  --accent: #1b263c;
  --accent-foreground: #e8eef9;
  --brand: #2dd4bf;
  --brand-foreground: #10203f;

  --destructive: #f87171;
  --destructive-foreground: #10203f;
  --success: #4ade80;
  --success-strong: #86efac;
  --success-foreground: #10203f;
  --warning: #fbbf24;
  --info: #60a5fa;

  --border: #26324a;
  --input: #2e3b55;
  --ring: #a78bfa;

  --elevation-card: 0 1px 2px rgb(0 0 0 / 0.3), 0 8px 24px -12px rgb(0 0 0 / 0.55);
  --elevation-popover: 0 12px 32px -12px rgb(0 0 0 / 0.65);
}

@theme inline {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-hover: var(--primary-hover);
  --color-primary-active: var(--primary-active);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-danger-strong: var(--danger-strong);
  --color-success: var(--success);
  --color-success-strong: var(--success-strong);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-info: var(--info);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-card: var(--elevation-card);
  --shadow-popover: var(--elevation-popover);

  --container-content: 40rem;
  --container-wide: 60rem;
  --container-admin: 75rem;
}
```

Mapping shadcn : `--background` = page, `--card` = surface blanche, `--accent` = survol,
`--brand` = accent de marque, `--destructive` = bouton danger. Les couleurs s'écrivent
`bg-background`, `text-muted-foreground`, `border-border`, `bg-success-strong`, etc.

## 15. Références par écran

| Écran / route | Fiche UX | Référence (structure, pas copie) | Points clés |
|---|---|---|---|
| Connexion `/sign-in`, inscription `/sign-up`, code `/verify-email` | `docs/ux/sign-in.md`, `sign-up.md`, `verify-email.md` | Clerk, Linear auth | **Aucune sidebar** ; carte centrée ≤ 400 px ; un CTA pleine largeur ; un seul `h1` |
| Fil `/` | `docs/ux/projects-feed.md` | Instagram (rythme), Linear (typographie) | Colonne 640 px ; média plein cadre, texte en surimpression ; compteurs réactions/commentaires/abonnés ; squelette par carte |
| Posts `/posts`, `/posts/[id]` | `docs/ux/posts.md` | Instagram, Read.cv | Flux continu sans séparateur de jour ; image 4:5 plein cadre ; aperçu de 2 commentaires ; compteurs |
| Catalogue `/projects` | `docs/ux/projects-catalog.md` | Linear, Vercel | Filtres en barre haute ; grille 1/2/3 ; badge de type + statut |
| Détail `/projects/[id]` | `docs/ux/project-detail.md`, `project-detail-tabs.md` | Linear, GitHub | Onglets 44 px ; galerie 16:9 ; une action primaire (suivre/commenter) |
| Profil `/u/[username]`, `/me/profile` | `docs/ux/profile.md`, `profile-edit.md` | Read.cv, LinkedIn sobre | Preuve d'abord : projets et compétences avant la bio ; avatar 96 px |
| Recherche `/search` | `docs/ux/search.md` | Linear | Barre unique, résultats denses, état vide explicite |
| Messages `/messages` | `docs/ux/messaging.md` | Signal, WhatsApp | Liste + fil ; bandeau chiffrement discret ; bulles max 75 % ; composer 44 px |
| Admin `/admin` | `docs/ux/admin-plateforme.md` | Vercel, Linear | Densité élevée, tableaux sobres, actions destructives nommées |
| Espaces `/spaces` | `docs/ux/spaces.md` | Notion, Circle | Cartes d'espace, accès lisible, un CTA « Rejoindre » |
| Paramètres `/settings` | `docs/ux/settings.md` | Linear settings, Raycast | Une section, trois cartes-radio ; aucun bouton « Enregistrer » |

## 16. Décisions à valider

| # | Décision | Défaut appliqué | Alternative |
|---|---|---|---|
| 1 | Couleur primaire | **Violet `#7C3AED`** (choix du 2026-10-29) | Bleu `#2F66DB` d'`AGENTS.md` |
| 2 | Accent de marque | Teal `#12A594`, usage rare | Supprimer `--brand` et rester monochrome violet |
| 3 | Neutres | Surface bleutée `#F6F8FC`, texte `#10203F` | Neutres gris purs (`#F5F5F5` / `#171717`) |
| 4 | Rayon et police | 14 px + Inter (tokens AGENTS) | 10 px + Geist (état antérieur) |
| 5 | Thème sombre | Conservé, palette dérivée | Clair uniquement |
| 6 | Primitives manquantes | Non installées (dialog, toast, alert, table) | Ajouter via shadcn et documenter ici |
| 7 | Nom du produit | « Réseau » provisoire | `docs/open-decisions.md` #4 |
| 8 | Ratio des images de post | 4:5 à 16:9, max 5 Mo | Ratio unique 1:1 |

Toute modification de ce tableau doit être répercutée dans `AGENTS.md` et
`docs/design-system.md`.
