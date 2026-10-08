---
description: Livrer en production (PR dev → main, tag, changelog) après validation sur dev
---
Release : **$ARGUMENTS**

**Prérequis à confirmer avec moi avant d'agir** : validation manuelle sur dev terminée, CI verte sur `dev`, migrations testées sur dev, aucune fonctionnalité hors version.
1. `/changelog $ARGUMENTS` (relecture par moi).
2. Ouvre la PR `dev` → `main` avec : changelog, migrations incluses, plan de retour arrière.
3. Après **mon** approbation et le merge : tag `v$ARGUMENTS`, suivi du déploiement `reseau-web-prod`, vérification de `/api/health` en production.
4. Rapporte. Ne fusionne jamais toi-même vers `main`.