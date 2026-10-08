# F05 — Créer un projet

- **Version** : V1 · **Dépend de** : F03, F04 · **Agents** : database, backend, frontend, designer, qa
- **Objectif** : créer et gérer des projets (brouillons), qui serviront de preuve de compétence une fois publiés (F06).
- **User story** : En tant que membre, je veux décrire un projet que j'ai réalisé, afin de prouver ce que je sais faire.

## Règles métier
1. Un projet appartient à **un seul** auteur (profil). Statut initial `draft`, visible **uniquement** de son auteur.
2. Champs : `title`, `body` (texte brut), `skills` (0 à 10 compétences du référentiel), `cover` (image optionnelle, envoyée via F06).
3. L'auteur peut **modifier** et **supprimer** son projet (brouillon ou publié).
4. Suppression : retire le projet, ses étiquettes et son image ; recalcule les niveaux de preuve concernés.
5. L'auteur peut lister ses projets (`/me/projects`) avec leur statut.
6. L'édition d'un projet publié met à jour `updated_at` ; les étiquettes modifiées recalculent les niveaux de preuve.

## Écrans / routes
`/me/projects` (liste) · `/me/projects/new` · `/me/projects/[id]/edit`. Fiche UX : `docs/ux/project-editor.md`.

## API (GraphQL, `POST /api/graphql`)
```graphql
type Mutation {
  createProject(input: CreateProjectInput!): Project!
  updateProject(id: ID!, input: UpdateProjectInput!): Project!
  deleteProject(id: ID!): Boolean!
}
input CreateProjectInput { title: String!, body: String!, skillSlugs: [String!], coverKey: String }
type Query { myProjects(first: Int = 20, after: String): ProjectConnection! }
```

## Données
`projects`, `project_skills`. Voir `data-model.md`.

## Validation (Zod, partagée)
`title` 3–120 · `body` 1–5000 · `skillSlugs` ≤ 10, slugs existants (ou création libre via F04) · `coverKey` : préfixe `projects/{profileId}/`.

## Erreurs
| Cas | Code | Message |
|---|---|---|
| Non propriétaire | FORBIDDEN | « Tu ne peux pas modifier ce projet. » |
| Projet introuvable | NOT_FOUND | « Projet introuvable. » |
| Titre/texte invalide | VALIDATION | Champ + règle |

## Sécurité
Propriétaire vérifié dans `application/` à chaque mutation. Texte échappé à l'affichage. Un brouillon n'est jamais renvoyé à un autre utilisateur (même par ID).

## Critères d'acceptation
- [ ] Un membre crée un brouillon avec titre, texte et 3 compétences.
- [ ] Le brouillon n'apparaît dans aucune liste publique et renvoie « introuvable » à un autre membre.
- [ ] Un membre modifie puis supprime son projet ; l'image associée est supprimée.
- [ ] Un membre ne peut pas modifier ni supprimer le projet d'un autre.
- [ ] Au-delà de 10 compétences, l'envoi est refusé avec message clair.

## Tests attendus
Unitaires : propriété, validation, recalcul de preuve. Intégration : cascade `project_skills`. E2E : créer → modifier → supprimer.

## Hors périmètre
Plusieurs images, vidéo, mise en forme riche (Markdown), liens d'artefacts (niveau `verifiable`, V1.5), collaboration à plusieurs auteurs, commentaires et mentions « j'aime ».
