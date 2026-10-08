#!/usr/bin/env bash
# SessionStart — ajoute au contexte la branche courante et le rappel de périmètre.
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'inconnue')"
echo "Contexte de session : branche '$branch'."
case "$branch" in
  main|dev) echo "ATTENTION : tu es sur '$branch'. Ne commite pas ici : crée un worktree feat/* via /build (après un plan approuvé)." ;;
esac
echo "Rappel : périmètre = V1 (fonctionnalités F01–F10). Fiche + plan validé avant tout code. Voir CLAUDE.md et docs/workflow.md."
exit 0
