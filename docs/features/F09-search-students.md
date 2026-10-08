# F09 — Rechercher un étudiant par compétence

- **Version** : V1 · **Dépend de** : F04, F08 · **Agents** : database, backend, frontend, designer, qa
- **Objectif** : trouver des membres qui possèdent une compétence donnée, classés par force de preuve.
- **User story** : En tant que membre, je veux rechercher « React », afin de trouver des étudiants qui le maîtrisent.

## Règles métier
1. Recherche sur **une compétence** (V1). Saisie avec autocomplétion (réutilise `GET /api/skills`).
2. Résultats : profils ayant cette compétence ; **tri** : `demonstrated` avant `declared`, puis nombre de projets publiés portant la compétence (décroissant), puis `profiles.created_at` récent, puis `id`.
3. Pagination par curseur (20 par page).
4. Compétence inconnue : message « Aucun résultat » + **suggestions proches** (trigramme) cliquables.
5. Chaque résultat : avatar, nom, `username`, établissement/filière, niveau de preuve pour cette compétence, nombre de projets liés.
6. Accessible aux membres connectés. Le membre connecté apparaît dans les résultats comme les autres.
7. Entrée normalisée avec le même `slugify` que F04.

## Écrans / routes
`/search` (champ + résultats) ; état partagé dans l'URL : `/search?skill=react`. Onglet de navigation « Recherche ». Fiche UX : `docs/ux/search.md`.

## API
REST : `GET /api/search/students?skill={slug}&cursor={c}&limit=20` → `{ items: StudentResult[], nextCursor }`.

## Données et index
`user_skills_skill_idx (skill_id, profile_id)`, `skills_slug_uq`, `skills_name_trgm`, `project_skills_skill_idx`. Requête unique avec jointure ; mesurer le plan (`EXPLAIN`) sur un jeu de 10 000 profils de test.

## Validation
`skill` slug 1–40 · `limit` 1–50 · `cursor` opaque signé (base64 du tuple de tri).

## Erreurs
Curseur invalide → `VALIDATION`. Compétence absente → 200 avec liste vide + suggestions.

## Critères d'acceptation
- [ ] Rechercher « react » liste les membres ayant cette compétence, ceux avec projets prouvés d'abord.
- [ ] « Réact » et « react » donnent le même résultat.
- [ ] Une faute légère (« javascipt ») propose « JavaScript ».
- [ ] La pagination ne répète ni ne saute de résultat.
- [ ] Temps de réponse serveur < 300 ms sur 10 000 profils de test (mesuré, `EXPLAIN` joint à la PR).
- [ ] Aucun e-mail ni donnée privée dans les résultats.

## Tests attendus
Unitaires : tri, curseur, normalisation. Intégration : requête avec jeu de données, plan d'exécution. E2E : saisie → résultat → profil.

## Hors périmètre
Combinaison de plusieurs compétences (V1.5), recherche texte libre sur nom/bio, filtres établissement/filière, résultats par proximité géographique, recherche par recruteurs.
