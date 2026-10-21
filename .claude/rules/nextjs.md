---
description: Pièges Next.js 16 / React 19 vérifiés sur ce projet
---
# Next.js 16 / React 19 — pièges vérifiés

- **`cacheComponents` (activé dans `next.config.ts`)** : ne jamais exporter `dynamic`
  ni `revalidate` dans une page ou un route handler — le build échoue. Un route handler
  n'est pas mis en cache par défaut.
- **`searchParams` dans une page** : lecture interdite pendant le prerender avec
  `cacheComponents` (erreur « uncached or runtime data during prerendering »). Lire les
  paramètres côté client avec `useSearchParams()` et **envelopper le composant dans
  `<Suspense>`** (fournir un fallback visible), ou bloquer la route avec
  `export const instant = false`.
- **Session / `cookies()` dans une page** : même contrainte. Une page qui lit la session
  (via `requireSession()`) doit poser `export const instant = false` — route bloquante
  assumée — sous peine d'échec de build « uncached or runtime data during prerendering ».
  Vérifié le 2026-10-09 sur `/`, `/onboarding/profile` et `/me/profile`. Le SDK Neon Auth
  journalise un `Cookie validation error` pendant la passe de prerender, mais le build
  réussit une fois `instant = false` posé.
- **Typecheck dans un arbre vierge (worktree)** : les types générés par Next (routes typées, `LayoutProps`) vivent dans `.next/types`. Sans build/typegen, `tsc` seul échoue. Toujours : `next typegen` PUIS `tsc --noEmit` (ou `next build`).
- **`middleware.ts` est déprécié en Next 16** : le fichier s'appelle désormais
  `src/proxy.ts` (même signature `NextRequest` → `NextResponse`, même `config.matcher`).
  Un projet neuf ne doit pas utiliser `middleware.ts`.
- **Config serveur** : ne jamais regrouper des secrets d'usage différent dans un même
  schéma (ex. auth + Turnstile). Un groupe manquant ne doit pas casser les routes qui
  n'en dépendent pas — schémas séparés dans `src/lib/env.ts`.
- **Lint React 19** : `react-hooks/set-state-in-effect` refuse `setState` dans un
  `useEffect` (motif « mounted »). Pour un rendu dépendant du thème, utiliser la variante
  CSS `dark:` ; sinon `useSyncExternalStore` (aussi pour `matchMedia` / store externe).
- **`react/no-unescaped-entities` + UI française** : une apostrophe dans du texte JSX
  (`qu'un`, `l'envoie`) est une **erreur** lint, pas un avertissement. Écrire `&apos;`
  (ou placer la chaîne dans un attribut/une constante). Vérifié le 2026-10-21 sur
  `/admin/otp` — `npm run lint` échoue donc sur tout nouveau texte français non échappé.
- **`useMemo` doit être pur** : pas de `Math.random()` ni d'entrée non déterministe.
  Pour un skeleton de largeur aléatoire, utiliser une largeur fixe ou une constante
  prévisible — sinon le rendu est instable.
- **MCP shadcn** : `view_items_in_registries` renvoie les métadonnées, **pas** le source.
  Écrire les composants depuis les dépendances déjà installées (`@radix-ui/react-slot`,
  `next-themes`), ne pas ajouter `radix-ui` sans nécessité.
- **`.env*`** : jamais lus ni écrits par un agent (hook `protect-files`) ; un secret se
  génère ou se collecte à la source, jamais via le dépôt.
