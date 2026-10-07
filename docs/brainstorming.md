# Brainstorming sur une fonctionnalité ou une correction

Règle : aucun fichier de code modifié tant que l'étape 5 n'est pas lancée.

1. **Cadrer** : reformuler le problème (symptôme, comportement attendu, comment le reproduire).
   Me demander confirmation que c'est bien compris.
2. **Investiguer en lecture seule** : trouver les fichiers concernés, formuler des hypothèses sur la cause.
3. **Explorer 2 à 3 solutions** : pour chacune, principe, fichiers touchés, risques (dont chiffrement et
   données personnelles), effort. Recommander une solution mais me laisser choisir.
4. **Écrire une mini-spec** dans `docs/fixes/<nom>.md` : problème, cause, solution retenue,
   critères de réussite, tests à écrire.
5. **Implémenter dans un worktree frais** à partir de la spec : d'abord le test qui reproduit
   le problème, puis la correction.
6. **Vérifier avant fusion** : tests, lint, build, relecture du diff, agent `securite` si nécessaire.
