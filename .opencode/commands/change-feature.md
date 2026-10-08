---
description: Faire évoluer une fonctionnalité existante (analyse d'impact puis mise à jour de la fiche)
---
Évolution demandée : **$ARGUMENTS**

1. Lis la fiche `docs/features/Fxx-*.md`, le code du module concerné et les tests existants.
2. Fais l'**analyse d'impact** : règles métier, API (contrat Zod/GraphQL), données (migration ?), UX (fiche à mettre à jour), tests à modifier, docs/CHANGELOG, compatibilité avec les données existantes.
3. Classe le changement : mineur (règle/texte), moyen (API/UI), majeur (données/sécurité). Pour majeur : propose un ADR.
4. Mets à jour la fiche en marquant clairement ce qui change (« Modifié le AAAA-MM-JJ : … »).
5. Aucun code. Termine par : « Fiche à jour, prêt pour `/plan Fxx`. »