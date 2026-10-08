#!/usr/bin/env bash
# PreToolUse (Bash) — garde-fous Git et commandes dangereuses.
# exit 2 = refusé. Les règles reflètent .claude/rules/git-workflow.md.
set -u
input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"
[ -z "$cmd" ] && exit 0

deny() { echo "BLOQUÉ par guard-git : $1" >&2; exit 2; }

# Pas de push forcé, ni de contournement des hooks
echo "$cmd" | grep -Eq 'git +push.*(--force|--force-with-lease| -f( |$))' && deny "push forcé interdit"
echo "$cmd" | grep -Eq '(--no-verify|--no-gpg-sign)' && deny "contournement des vérifications interdit"

# Pas de push direct vers main ou dev (passer par une PR)
echo "$cmd" | grep -Eq 'git +push.*( |:)(main|dev)( |$)' && deny "push direct vers main/dev interdit : ouvrir une PR depuis une branche feat/*"

# Pas de commit sur main ou dev
if echo "$cmd" | grep -Eq 'git +commit'; then
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
  case "$branch" in main|dev) deny "commit direct sur '$branch' interdit : créer un worktree feat/* (/build)" ;; esac
fi

# Opérations destructrices
echo "$cmd" | grep -Eq 'git +reset +--hard|git +clean +-[a-z]*f' && deny "opération destructrice : demander à l'humain"
echo "$cmd" | grep -Eq 'rm +-[a-zA-Z]*r[a-zA-Z]*f? +(/|~|\.\.?)( |$)' && deny "suppression récursive dangereuse"

# drizzle-kit push contourne les migrations versionnées
echo "$cmd" | grep -Eq 'drizzle-kit +push' && deny "utiliser drizzle-kit generate + migrate (migrations versionnées)"

# Lecture de secrets via le shell
echo "$cmd" | grep -Eq '(cat|less|more|head|tail|grep|source|printenv|env)[^|;&]*\.env( |$|\.local|\.production|\.development)' \
  && ! echo "$cmd" | grep -q '\.env\.example' && deny "lecture de fichiers de secrets interdite"
exit 0
