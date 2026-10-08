# F07 — Consulter les projets des autres étudiants

- **Version** : V1 · **Dépend de** : F06 · **Agents** : backend, frontend, designer, qa
- **Objectif** : découvrir les projets publiés par les autres membres.
- **User story** : En tant que membre, je veux parcourir les projets, afin de m'inspirer et de repérer des profils.

## Règles métier
1. Seuls les projets `published` sont listés, **du plus récent au plus ancien** (`published_at DESC, id DESC`).
2. Accessible aux **membres connectés** uniquement.
3. Pagination par **curseur** (20 par page, « Voir plus »). Jamais d'`OFFSET`.
4. Filtre facultatif par compétence (`skill`).
5. Chaque carte : image de couverture (ou visuel par défaut), titre, extrait du texte, auteur (nom + avatar + lien profil), compétences (max 3 + « +n »).
6. Détail d'un projet : texte complet, image, auteur, toutes les compétences. Un brouillon n'est visible que de son auteur.
7. Les projets de l'utilisateur lui-même apparaissent aussi dans la liste.

## Écrans / routes
`/` (liste) · `/projects/[id]` (détail). Fiches UX : `docs/ux/projects-feed.md`, `docs/ux/project-detail.md`.

## API (GraphQL)
```graphql
type Query {
  projects(first: Int = 20, after: String, skillSlug: String, authorUsername: String): ProjectConnection!
  project(id: ID!): Project
}
type Project { id: ID!, title: String!, body: String!, coverUrl: String, status: ProjectStatus!, publishedAt: DateTime,
  author: ProfileSummary!, skills: [SkillBadge!]! }
```
Résolution des auteurs et compétences par **DataLoader** (pas de N+1). Limite de profondeur et de complexité de requête activée.

## Données
Index `projects_published_idx`, `project_skills_skill_idx`.

## Erreurs
`NOT_FOUND` pour un projet inexistant **ou** non visible (même message : pas de fuite). Curseur invalide → `VALIDATION`.

## Critères d'acceptation
- [ ] La liste affiche d'abord le dernier projet publié.
- [ ] « Voir plus » charge la page suivante sans doublon ni saut.
- [ ] Un brouillon n'apparaît jamais dans la liste et son URL renvoie « introuvable » aux autres.
- [ ] Le filtre par compétence ne montre que les projets étiquetés.
- [ ] Un visiteur non connecté est redirigé vers la connexion.
- [ ] Une requête sans N+1 : le nombre de requêtes SQL est indépendant du nombre de projets (test).

## Tests attendus
Unitaires : visibilité, curseur. Intégration : ordre et pagination, comptage de requêtes. E2E : parcours liste → détail → profil de l'auteur.

## Hors périmètre
Fil libre, « j'aime », commentaires, partage externe, recommandations, recherche plein texte dans les projets (V1.5).
