#!/usr/bin/env bash
# PreToolUse (Edit|Write|MultiEdit) — bloque l'écriture de fichiers sensibles ou figés.
# Entrée : JSON sur stdin. Sortie : exit 2 + message sur stderr = action refusée.
set -u
input="$(cat)"
file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"
[ -z "$file" ] && exit 0

deny() { echo "BLOQUÉ par protect-files : $1 ($file)" >&2; exit 2; }

case "$file" in
  *.env.example) ;;                                   # le modèle est autorisé
  *.env|*.env.*|*/.env|*/.env.*) deny "fichier de secrets" ;;
  *.pem|*.key|*id_rsa*|*credentials*.json) deny "clé ou identifiants" ;;
  */.git/*|*/node_modules/*) deny "dossier géré par l'outil" ;;
  */pnpm-lock.yaml) deny "fichier de verrouillage : utiliser pnpm" ;;
esac

# Une migration déjà suivie par git ne se modifie jamais : écrire une nouvelle migration.
case "$file" in
  */packages/db/migrations/*)
    if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
      deny "migration déjà committée : créer une nouvelle migration (skill drizzle-migration)"
    fi ;;
esac
exit 0
