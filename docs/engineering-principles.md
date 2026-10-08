# Approches d'ingénierie à adopter

Réponse à : « quelles approches dois-je adopter pour mener un projet sérieux sans être perdu ? »

1. **Spec d'abord (spec-driven).** Aucune ligne de code avant la fiche et le plan validé. C'est le remède direct à l'ajout permanent de fonctionnalités suivi de corrections.
2. **Périmètre verrouillé par version.** `roadmap.md` décide. Une idée hors version va dans `open-decisions.md` ou la roadmap, pas dans le code.
3. **Tranches verticales minces.** Une fonctionnalité traverse toutes les couches et se termine (testée, déployée sur dev) avant la suivante.
4. **Contract-first.** Schémas Zod et schéma GraphQL écrits d'abord ; frontend et backend s'y conforment.
5. **Architecture en couches, dépendances à sens unique.** Testabilité et remplacement facile d'un fournisseur (Auth, Storage).
6. **Tests proportionnés (pyramide).** Beaucoup de tests unitaires sur `application/` (règles métier), quelques tests d'intégration (data), un parcours E2E par fonctionnalité clé.
7. **Définition de « terminé » explicite.** Elle remplace le « ça a l'air de marcher ».
8. **Petits commits, petites PR, intégration fréquente.** Branches courtes, worktrees isolés.
9. **Migrations réversibles et progressives** (*expand puis contract*), toujours testées sur dev avant la production.
10. **Environnements séparés et identiques.** dev et production ont la même forme ; seule la configuration change (variables, branche Neon).
11. **Sécurité dès la conception.** Autorisation côté serveur, validation d'entrée, principe du moindre privilège, aucun secret dans le dépôt.
12. **Décisions écrites (ADR).** Pourquoi GraphQL seulement pour les projets ? Pourquoi Neon Auth ? On le relit dans 6 mois.
13. **Revue croisée par des agents spécialisés.** L'agent qui écrit n'est pas celui qui valide la sécurité ni les tests.
14. **Mesurer avant d'optimiser.** Index et pagination dès le départ ; reste à mesurer (temps de requête, poids de page) avant d'ajouter du cache.
15. **Réduire la surface, pas la qualité.** Moins de fonctionnalités, mais complètes : tous les états UI, toutes les erreurs gérées.

## Anti-patterns à refuser
- « Je rajoute juste ça » hors fiche · logique métier dans un composant ou un résolveur · SQL hors `data/` · valeurs en dur (couleurs, URL, secrets) · migration appliquée à la main · test supprimé pour faire passer la CI · optimisation prématurée.
