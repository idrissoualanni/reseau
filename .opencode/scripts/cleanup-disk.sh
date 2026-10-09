#!/bin/sh
# Nettoyage disque/mémoire plein : caches et temp régénérables.
# Règle AGENTS.md : « quand la memoire est plein supprime des cache et vide le temp ».
# Utilisation : sh .opencode/scripts/cleanup-disk.sh
# Ne supprime jamais : node_modules, .git, fichiers trackés, .env*.

set -eu

echo "=== Disque avant ==="
df -h /c | tail -1

# 1. Cache npm (régénérable par npm install)
if [ -d "$LOCALAPPDATA/Temp/npm-cache" ]; then
  rm -r "$LOCALAPPDATA/Temp/npm-cache" && echo "npm-cache supprimé"
fi

# 2. Cache de compilation node
if [ -d "$LOCALAPPDATA/Temp/node-compile-cache" ]; then
  rm -r "$LOCALAPPDATA/Temp/node-compile-cache" && echo "node-compile-cache supprimé"
fi

# 3. Fichiers temporaires racine du Temp (*.tmp, *.log régénérables, cpuprofile)
find "$LOCALAPPDATA/Temp" -maxdepth 1 -type f \( -name '*.tmp' -o -name '*.cpuprofile' -o -name 'mat-debug-*.log' -o -name 'vscode-inno-updater-*.log' -o -name 'cv_debug.log' -o -name '.bun-*' -o -name '*.tmp.exe' \) -delete 2>/dev/null || true

# 4. Extractions MEI (installateurs/analyseurs temporaires, régénérables)
find "$LOCALAPPDATA/Temp" -maxdepth 1 -type d -name '_MEI*' -exec rm -r {} + 2>/dev/null || true

# 5. Caches régénérables du dépôt (ignorés par git)
rm -rf "$(git rev-parse --show-toplevel 2>/dev/null)/.next" "$(git rev-parse --show-toplevel 2>/dev/null)/dist" 2>/dev/null || true

echo "=== Disque après ==="
df -h /c | tail -1