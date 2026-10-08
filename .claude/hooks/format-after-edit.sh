#!/usr/bin/env bash
# PostToolUse (Edit|Write|MultiEdit) — formate le fichier modifié avec Prettier (silencieux si absent).
set -u
input="$(cat)"
file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"
[ -z "$file" ] && exit 0
case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md|*.mdx)
    if command -v pnpm >/dev/null 2>&1 && [ -f "${CLAUDE_PROJECT_DIR:-.}/package.json" ]; then
      (cd "${CLAUDE_PROJECT_DIR:-.}" && pnpm exec prettier --write "$file" >/dev/null 2>&1) || true
    fi ;;
esac
exit 0
