# Règles — secrets et clés

Règle opposable : aucun secret ne quitte sa source.

## Stockage
- `.env.local` : secrets locaux, **gitignoré** (`.env*`, exception `.env.example`).
- `.secrets/` : clés CLI/MCP (ex. `render-api-key`), **gitignoré**.
- Config OpenCode : jamais de valeur en dur → `{env:NEON_API_KEY}` ou `{file:~/.secrets/<nom>}`.
- Render : `sync: false` dans `render.yaml`, valeur posée dans le dashboard.

## Manipulation
- Ne jamais `echo`/`print`/logguer une valeur de secret, même « pour vérifier ».
- Inventorier un environnement = **lister les noms** (`cut -d= -f1`), jamais les valeurs.
- Fichier temporaire contenant un secret : hors dépôt, supprimé après usage.

## Divulgation
- Un secret affiché dans une sortie, un log ou un chat est **divulgué** → rotation
  immédiate par le propriétaire, ne jamais le recopier.
- Après rotation : mettre à jour `.env.local`, le dashboard Render et la config locale.

## Vérification avant commit
```bash
git ls-files | grep -Ei '\.env|secret|credential'   # seuls .env.example attendus
git grep -nEI 'napi_|rnd_[A-Za-z0-9]{10,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}'
```
