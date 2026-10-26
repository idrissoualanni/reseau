# F20 — Mises à jour de projet (Project Updates)

- **Version** : V1.5 · **Dépend de** : F06, F19 · **Agents** : backend, frontend, database, qa
- **Objectif** : permettre à l'auteur d'un projet de raconter sa progression (texte et/ou image) et aux visiteurs de suivre cette activité.
- **User story** : En tant qu'auteur, je veux publier des mises à jour pour montrer l'avancement réel de mon projet ; en tant que membre, je veux consulter cette activité.

## Règles métier

1. Seul l'auteur du projet peut créer ou supprimer une mise à jour.
2. Une mise à jour contient un texte (0–5000 caractères) et/ou une image (5 Mo max, JPEG/PNG/WebP).
3. La clé d'image doit appartenir au préfixe `projects/{profileId}/updates/`.
4. Les mises à jour sont listées du plus récent au plus ancien, paginées par 20.
5. La suppression est réservée à l'auteur de la mise à jour.
6. Les notifications aux suiveurs (F19) restent en attente.

## Écran / route

- `/projects/[id]` → onglet **Activité**.
- Composants : `ProjectActivity`, `ImageUploader`.
- Le préfixe d'upload est calculé avec le `profileId` réel du viewer, jamais `current-user`.

## API (GraphQL)

```graphql
type ProjectUpdate {
  id: ID!
  body: String!
  imageUrl: String
  createdAt: DateTime!
  updatedAt: DateTime!
  author: ProfileSummary!
}

type ProjectUpdateConnection {
  edges: [ProjectUpdateEdge!]!
  pageInfo: PageInfo!
}

extend type Project {
  updateCount: Int!
  updates(first: Int = 20, after: String): ProjectUpdateConnection!
}

input CreateProjectUpdateInput {
  projectId: ID!
  body: String
  imageKey: String
}

type Mutation {
  createProjectUpdate(input: CreateProjectUpdateInput!): ProjectUpdate!
  deleteProjectUpdate(input: DeleteProjectUpdateInput!): Boolean!
}
```

## Données

Table `project_updates` (migration `0009_v15_project_features.sql`) :

- `id`, `project_id` (cascade), `author_id` (cascade), `body`, `image_key`, `created_at`, `updated_at`.
- Contrainte `project_updates_body_check` : `char_length(body) BETWEEN 0 AND 5000`
  (migration `0010_post_likes.sql`), pour autoriser une mise à jour image seule.
- Bucket `projet`, clé publique `projects/{profileId}/updates/{uuid}.{ext}`.

## Validation (Zod)

- `projectId` : UUID.
- `body` : optionnel, trim, 0–5000 (vide autorisé seulement si une image est fournie).
- `imageKey` : optionnel/nullable, regex `projects/{uuid}/updates/{fichier}`.
- Au moins un des deux champs (`body` ou `imageKey`) est requis.

## Sécurité

- `createProjectUpdate` vérifie que le projet appartient à `ctx.profileId`.
- `deleteProjectUpdate` filtre sur `author_id = ctx.profileId`.
- Aucune clé de stockage privée n'est envoyée au client : seule `imageUrl` publique sort.

## Critères d'acceptation

- [x] L'auteur publie une mise à jour texte ; elle apparaît en tête de l'onglet Activité.
- [x] L'auteur publie une mise à jour avec image ; l'image s'affiche après upload.
- [x] Un visiteur ne voit pas le formulaire de création.
- [x] L'auteur supprime sa mise à jour ; la liste est mise à jour.
- [x] Un visiteur ne peut pas supprimer la mise à jour d'un autre.
- [x] La pagination « Voir plus » charge les mises à jour suivantes.
- [x] Une mise à jour vide (ni texte ni image) est refusée.

## Tests attendus

- Unitaires : `createProjectUpdateSchema` (image seule acceptée, vide refusée).
- Intégration : création/suppression via actions serveur, contrôle de propriété.
- E2E : publier une update avec image, la voir, la supprimer.

## Hors périmètre

- Notifications WebSocket aux suiveurs (en attente F19).
- Vidéo, Markdown riche, mentions.
- Édition d'une mise à jour existante.
