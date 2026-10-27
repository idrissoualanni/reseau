#!/bin/sh
# Nettoyage disque/mémoire plein : caches et temp régénérables.
# Règle AGENTS.md : « quand la memoire est plein supprime des cache et vide le temp ».
# Utilisation : sh .opencode/scripts/cleanup-disk.sh
# Ne supprime jamais : node_modules, .git, fichiers trackés, .env*.

set -u

echo "=== Disque avant ==="
df -h /c | tail -1

# 1. Caches de paquets (régénérables par npm install)
for d in "$LOCALAPPDATA/npm-cache" "$LOCALAPPDATA/Temp/npm-cache" "$LOCALAPPDATA/pnpm/store" "$HOME/.cache"; do
  if [ -e "$d" ]; then rm -r "$d" 2>/dev/null && echo "supprimé : $d"; fi
done

# 2. Cache de compilation node
if [ -d "$LOCALAPPDATA/Temp/node-compile-cache" ]; then
  rm -r "$LOCALAPPDATA/Temp/node-compile-cache" && echo "node-compile-cache supprimé"
fi

# 2b. Binaires Playwright (cache réinstallable via `npx playwright install`)
if [ -d "$LOCALAPPDATA/ms-playwright" ]; then
  rm -r "$LOCALAPPDATA/ms-playwright" 2>/dev/null && echo "ms-playwright supprimé"
fi

# 3. Fichiers temporaires racine du Temp (régénérables)
find "$LOCALAPPDATA/Temp" -maxdepth 1 -type f \( -name '*.tmp' -o -name '*.cpuprofile' -o -name 'mat-debug-*.log' -o -name 'vscode-inno-updater-*.log' -o -name 'cv_debug.log' -o -name '.bun-*' -o -name '*.tmp.exe' -o -name '*.log' \) -delete 2>/dev/null || true

# 4. Extractions MEI (installateurs/analyseurs temporaires, régénérables)
find "$LOCALAPPDATA/Temp" -maxdepth 1 -type d -name '_MEI*' -exec rm -r {} + 2>/dev/null || true

# 5. Caches de build .next : dépôt courant + worktrees voisins
here="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
base="$(dirname "$here")"
for d in "$here" "$base"/reseau* "$here"/.opencode/worktrees/*; do
  [ -d "$d/.next" ] && rm -rf "$d/.next" 2>/dev/null && echo ".next supprimé : $d"
  [ -d "$d/dist" ] && rm -rf "$d/dist" 2>/dev/null && echo "dist supprimé : $d"
done

# 6. Gros dossiers de temp régénérables (installeurs, caches navigateur)
for d in \
  "$LOCALAPPDATA/Temp/vscode-stable-user-x64" \
  "$LOCALAPPDATA/Temp/msedgecrxedge_BITS_4876_760476866" \
  "$LOCALAPPDATA/Temp/_uninstall339B42B5" \
  "$LOCALAPPDATA/Temp/BRL000042c4"; do
  if [ -d "$d" ]; then rm -r "$d" 2>/dev/null && echo "temp supprimé : $d"; fi
done

# 7. Logs et snapshots OpenCode (régénérables, jamais opencode.db)
if [ -d "$HOME/.local/share/opencode/log" ]; then
  find "$HOME/.local/share/opencode/log" -mindepth 1 -delete 2>/dev/null && echo "logs OpenCode supprimés"
fi
if [ -d "$HOME/.local/share/opencode/snapshot" ]; then
  find "$HOME/.local/share/opencode/snapshot" -mindepth 1 -delete 2>/dev/null && echo "snapshots OpenCode supprimés"
fi

echo "=== Disque après ==="
df -h /c | tail -1
