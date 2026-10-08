---
name: deploy-render-neon
description: Déployer et vérifier dev puis production sur Render avec les branches Neon correspondantes. À utiliser pour déploiement, variables d'environnement, migrations en environnement, diagnostic d'un déploiement.
---
# Déploiement Render + Neon

Correspondance : `dev` ↔ service `reseau-web-dev` ↔ branche Neon `dev` ; `main` ↔ `reseau-web-prod` ↔ branche Neon `main` (`docs/environments-and-deploy.md`).

1. Vérifier la CI verte et la validation demandée. Production : uniquement via `/release`, après validation sur dev.
2. Valider le Blueprint : `render blueprints validate`.
3. Variables : `.env.example` fait foi ; valeurs saisies dans Render (environment groups par environnement, `sync: false` pour les secrets). Ne jamais lire ni afficher de secret.
4. Migrations : appliquées sur la branche Neon de l'environnement **avant** de basculer le trafic (dev d'abord).
5. Suivre le déploiement (MCP Render ou tableau de bord), lire les logs en cas d'échec, vérifier `GET /api/health`.
6. Retour arrière : redéployer le build précédent ; si migration en cause, exécuter le plan de retour arrière de la PR.
7. Cloudflare : DNS/proxy, règles de limitation de débit et Turnstile configurés pour le domaine concerné.
