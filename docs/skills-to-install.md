# Skills à installer

## Skills du projet (déjà dans `.claude/skills/`)
`feature-spec` · `ux-brief` · `drizzle-migration` · `graphql-posts` · `vitest-testing` · `deploy-render-neon`.

## Skills externes recommandés
| Domaine | Source | Commande / action |
|---|---|---|
| Neon (général) | Neon | `neon skills -s neon -y` |
| Neon Auth pour Next.js | dépôt `neondatabase/neon-js` | `npx skills add https://github.com/neondatabase/neon-js --skill neon-auth-nextjs` |
| Neon Object Storage | Neon agent-skills | via `neon skills` (skill `neon-object-storage`) ou dépôt `neondatabase/agent-skills` |
| shadcn/ui | documentation officielle shadcn | **À vérifier** : le MCP shadcn (`npx shadcn@latest mcp init`) et/ou un skill shadcn publié ; consulter ui.shadcn.com |
| Bonnes pratiques Next.js | skills Next.js/Vercel | **À vérifier** : rechercher « next best practices » dans l'annuaire de skills (`npx skills find`) et installer un skill maintenu |
| Drizzle | documentation officielle | skill ou MCP si disponible ; sinon `drizzle-migration` du projet suffit |
| Vitest | — | `vitest-testing` du projet |
| Interface soignée | skill `frontend-design` (déjà disponible dans Claude) | l'utiliser pour les pages |

> Règle : n'installer un skill externe qu'après lecture de son contenu et de sa source. Épingler la version. Les commandes marquées « à vérifier » doivent être confirmées avant usage.

## MCP utiles
- **Neon** (inspection base/branches) · **Render** (`mcp.render.com`, logs et déploiements) · **shadcn** (ajout de composants).
- Configurer dans `.mcp.json` (non committé tel quel si contient des clés ; utiliser des variables).
