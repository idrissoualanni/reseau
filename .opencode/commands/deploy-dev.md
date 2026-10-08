---
description: Déployer et vérifier l'environnement dev sur Render
---
Utilise le skill `deploy-render-neon` et l'agent `devops`.
1. Vérifie que la PR est fusionnée dans `dev`, que la CI est verte et que les migrations sont appliquées sur la branche Neon `dev`.
2. Suit le déploiement `reseau-web-dev` (MCP Render ou tableau de bord) ; lis les logs en cas d'échec.
3. Vérifie `GET https://dev.<domaine>/api/health`, puis parcours les critères d'acceptation de la fiche sur dev.
4. Rapporte : version déployée, état, anomalies, checklist de validation manuelle pour moi.
Ne touche jamais à la production.