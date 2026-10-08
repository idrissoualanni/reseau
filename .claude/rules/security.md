---
description: Authentification, autorisation, validation, uploads, données personnelles
---
# Sécurité

- **Sans RLS : l'autorisation est dans `application/`**, vérifiée à chaque cas d'usage (« cet utilisateur peut-il faire cela sur cette ressource ? »). Jamais seulement dans l'UI ni dans le middleware.
- Identité : toujours lue depuis la session (`lib/auth.ts`), jamais depuis le corps de requête, l'URL ou un argument GraphQL.
- Ressource non visible = `NOT_FOUND` (même réponse que « inexistant »).
- Middleware Neon Auth : routes protégées par défaut ; liste blanche explicite des routes publiques (F02).
- Validation Zod de **toute** entrée serveur ; `.strict()`. Échapper à l'affichage (React le fait ; jamais `dangerouslySetInnerHTML` avec du contenu utilisateur).
- Redirections (`next`) : chemins internes uniquement.
- Uploads : types listés (JPEG/PNG/WebP), ≤ 5 Mo, URL présignée courte (≤ 5 min), clé générée serveur (`{kind}/{profileId}/{uuid}.{ext}`), propriété de la clé vérifiée avant usage.
- Secrets : aucun dans le dépôt ; `.env*` et fichiers de clés jamais lus ni écrits par les agents (hook `protect-files`). Rotation en cas de fuite.
- Cloudflare : WAF, limitation de débit sur `/api/auth/*` et `/api/uploads/*`, Turnstile à l'inscription.
- Logs : aucun e-mail, mot de passe, code, jeton, contenu de profil. Identifiants opaques uniquement.
- Réponses : en-têtes de sécurité (CSP, `X-Content-Type-Options`, `Referrer-Policy`), cookies `HttpOnly`/`Secure`/`SameSite`.
- Données personnelles : minimiser, durée de conservation définie, suppression de compte avant production, conformité loi sénégalaise à valider (`docs/risks.md`).
- Dépendances : épingler les versions, `npm audit` en CI, pas de dépendance non nécessaire.
- L'agent `security` revoit chaque PR touchant auth, uploads, autorisation ou SQL.
