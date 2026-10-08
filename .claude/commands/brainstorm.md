---
description: Brainstormer une nouvelle fonctionnalité ou l'évolution d'une fonctionnalité existante (avant toute spec)
argument-hint: <idée ou Fxx à faire évoluer>
---
Tu animes un brainstorming structuré sur : **$ARGUMENTS**

Ne produis AUCUN code ni fichier. Lecture seule.

1. Lis `CLAUDE.md`, `docs/roadmap.md` et, si une fonctionnalité existe, `docs/features/Fxx-*.md`.
2. Vérifie le **périmètre** : l'idée appartient-elle à la version en cours (V1) ? Sinon, dis-le et propose de la ranger dans la roadmap.
3. Pose **une seule question à la fois** (la plus structurante), avec ta recommandation. Attends la réponse avant la suivante. Maximum 6 questions.
4. Quand c'est clair, produis une synthèse courte :
   - Problème utilisateur et acteur concerné
   - 2 ou 3 options (avantages, coûts, risques) avec **ta recommandation**
   - Ce qui est explicitement **hors périmètre**
   - Impacts : données, API, UX, sécurité
   - Décisions à trancher (liste)
5. Termine par : « Prochaine étape : `/new-feature` (nouvelle) ou `/change-feature` (existante) pour écrire la fiche. »
