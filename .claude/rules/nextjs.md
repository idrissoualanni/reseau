---
description: Pièges Next.js 16 / React 19 vérifiés sur ce projet
---
# Next.js 16 / React 19 — pièges vérifiés

- **`cacheComponents` (activé dans `next.config.ts`)** : ne jamais exporter `dynamic`
  ni `revalidate` dans une page ou un route handler — le build échoue. Un route handler
  n'est pas mis en cache par défaut.
- **Lint React 19** : `react-hooks/set-state-in-effect` refuse `setState` dans un
  `useEffect` (motif « mounted »). Pour un rendu dépendant du thème, utiliser la variante
  CSS `dark:` ; sinon `useSyncExternalStore`.
- **MCP shadcn** : `view_items_in_registries` renvoie les métadonnées, **pas** le source.
  Écrire les composants depuis les dépendances déjà installées (`@radix-ui/react-slot`,
  `next-themes`), ne pas ajouter `radix-ui` sans nécessité.
- **`.env*`** : jamais lus ni écrits par un agent (hook `protect-files`) ; un secret se
  génère ou se collecte à la source, jamais via le dépôt.
