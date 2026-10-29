# Tests E2E (Playwright)

> Config : `playwright.config.ts` · specs : `e2e/**/*.spec.ts` · navigateur : Chrome système
> par défaut (`channel: "chrome"`), aucun téléchargement Chromium.

## Commandes

```bash
npm run test:e2e          # suite complète (démarre `npm run dev` si besoin)
npm run test:e2e:ui       # mode UI
npx playwright test e2e/smoke.spec.ts   # une spec
```

Contre un serveur déjà déployé :

```bash
PLAYWRIGHT_BASE_URL=https://reseau-3tuk.onrender.com npm run test:e2e
```

Sans Chrome système (CI Linux) :

```bash
npx playwright install chromium
PLAYWRIGHT_CHANNEL= npm run test:e2e
```

## Portée

- `e2e/smoke.spec.ts` : pages publiques (connexion, redirection d'une route protégée,
  absence d'erreur console). Aucune base ni session requise.
- Les parcours authentifiés nécessitent deux comptes de test et la base Neon **dev**.
  Ne jamais pointer la production.
- Les anciennes specs de `tests/` sont exclues de `tsconfig` et de Vitest ; elles seront
  réparées ou supprimées (voir `docs/TODO.md`).

## Règles

- Pas de secret dans une spec ni dans un rapport.
- `playwright-report/` et `test-results/` sont gitignorés.
- Une spec qui échoue bloquante : corriger ou retirer avec justification, jamais `skip`
  silencieux.
