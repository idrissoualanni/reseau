# F19 — Fonctionnalités sociales sur projets (likes, commentaires, suivi)

- **Version** : V1.5 · **Dépend de** : F06, F11 · **Agents** : database, backend, frontend, designer, qa, security
- **Objectif** : permettre aux membres d'interagir avec les projets publiés (réagir, commenter, suivre) pour créer de l'engagement.
- **User story** : En tant que membre, je veux réagir à un projet, en discuter et être notifié de son activité pour m'engager avec la communauté.

## Règles métier

### Réactions (4 types)
1. Types : `like` 👍, `celebrate` 🎉, `insight` 💡, `curious` 🤔
2. Un membre = 1 réaction par type par projet (toggle on/off)
3. Affichage : compteur par type + indicateur "vous avez réagi"
4. Suppression projet → cascade delete réactions

### Commentaires (imbriqués, max 3 niveaux visuels)
1. Tout membre connecté peut commenter un projet publié
2. Réponses aux commentaires (parent_id) → indentation max 3 niveaux, puis "Voir plus"
3. Longueur max 1000 caractères, texte brut (pas HTML)
4. Auteur peut supprimer son commentaire → cascade delete réponses
5. Modération : admin plateforme peut masquer/supprimer (F17)

### Suivi (Follow)
1. Tout membre peut suivre/ne plus suivre un projet publié
2. Compteur public `followerCount`
3. Notifications in-app (WebSocket) sur : nouveau commentaire, nouvelle update (F20)
4. Liste suiveurs accessible (paginée) pour auteur et admins

### Partage
1. Bouton "Partager" → native share API + copie lien
2. Pas de tracking serveur en V1.5

## Écrans / routes

- `/projects/[id]` — onglets : **Aperçu** | **Activité** | **Discussion** | **Suiveurs**
- Fiche UX : `docs/ux/project-detail-tabs.md`
- Composants : `ProjectTabs`, `ReactionButtons`, `ProjectCommentThread`, `ProjectFollowers`

## API (GraphQL)

```graphql
enum ProjectReactionType {
  LIKE
  CELEBRATE
  INSIGHT
  CURIOUS
}

type ProjectReaction {
  type: ProjectReactionType!
  count: Int!
  hasReacted: Boolean!
}

type ProjectComment {
  id: ID!
  body: String!
  createdAt: DateTime!
  updatedAt: DateTime!
  author: ProfileSummary!
  replies: [ProjectComment!]!
  reactionCounts: [ProjectReaction!]!
  depth: Int!
}

type ProjectCommentConnection {
  edges: [ProjectCommentEdge!]!
  pageInfo: PageInfo!
}

extend type Project {
  reactions: [ProjectReaction!]!
  comments(first: Int = 20, after: String): ProjectCommentConnection!
  followerCount: Int!
  isFollowed: Boolean!
  followers(first: Int = 20, after: String): ProfileConnection!
}

input AddProjectReactionInput {
  projectId: ID!
  type: ProjectReactionType!
}

input CreateProjectCommentInput {
  projectId: ID!
  parentId: ID
  body: String!
}

type Mutation {
  addProjectReaction(input: AddProjectReactionInput!): ProjectReaction!
  removeProjectReaction(projectId: ID!, type: ProjectReactionType!): Boolean!
  createProjectComment(input: CreateProjectCommentInput!): ProjectComment!
  deleteProjectComment(id: ID!): Boolean!
  followProject(projectId: ID!): Boolean!
  unfollowProject(projectId: ID!): Boolean!
}
```

## Données

**Tables additives V1.5** (migrations Drizzle) :

```sql
CREATE TYPE project_reaction_type AS ENUM ('like', 'celebrate', 'insight', 'curious');

CREATE TABLE project_reactions (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type project_reaction_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, profile_id, type)
);

CREATE TABLE project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES project_comments(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) <= 1000),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX project_comments_project_idx ON project_comments (project_id, created_at DESC);
CREATE INDEX project_comments_parent_idx ON project_comments (parent_id);

CREATE TABLE project_followers (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, profile_id)
);
CREATE INDEX project_followers_profile_idx ON project_followers (profile_id);
```

## Validation (Zod)

- `body` commentaire : 1-1000 car, trim, pas `<>`
- `parentId` : UUID valide, même projet (vérifié en useCase)
- `type` reaction : enum `ProjectReactionType`
- `projectId` : projet publié existant

## Erreurs

| Cas | Code | Message |
|---|---|---|
| Projet non publié | FORBIDDEN | "Ce projet n'est pas publié." |
| Commentaire vide | VALIDATION | "Le commentaire ne peut pas être vide." |
| Commentaire trop long | VALIDATION | "Texte trop long (1000 caractères maximum)." |
| Réponse hors projet | VALIDATION | "La réponse ne cible pas le bon projet." |
| Déjà réagi ce type | CONFLICT | "Vous avez déjà réagi ainsi." |
| Projet introuvable | NOT_FOUND | "Projet introuvable." |

## Sécurité et autorisation

- Propriétaire vérifié pour suppression commentaire propre
- Admin plateforme : modération complète (masquer/supprimer tout)
- Rate limiting : 30 reactions/min, 10 comments/min, 5 follow/min par IP
- WebSocket auth : token JWT Neon Auth requis
- Aucune donnée privée dans réponses (pas d'email, user_id)

## Critères d'acceptation

- [ ] Given un projet publié, When un membre clique "J'aime", Then le compteur incrémente et le bouton passe en état actif.
- [ ] Given une réaction existante, When le membre reclique, Then la réaction est retirée (toggle).
- [ ] Given un commentaire, When un autre membre répond, Then la réponse s'affiche indentée (niveau 1).
- [ ] Given 3 niveaux de réponses, When une 4ème répond, Then "Voir plus" apparaît sans indentation supplémentaire.
- [ ] Given un suivi, When un nouveau commentaire est posté, Then le suiveur reçoit notification WebSocket temps réel.
- [ ] Given un projet supprimé, Then toutes réactions, commentaires, suivis sont supprimés en cascade.

## Tests attendus

- Unitaires : toggle reaction, commentaire arborescence, cascade delete, follow/unfollow
- Intégration : GraphQL mutations + DataLoader (reactionsByProjectId, commentsByProjectId)
- E2E : réaction → commentaire → réponse → suivi → notification WebSocket
- WebSocket : connexion, auth, réception events, reconnexion

## Hors périmètre

- Réactions personnalisées / emojis libres
- Mentions @username dans commentaires (V2)
- Modération communautaire (signaler) — admin seulement V1.5
- Notifications email/push (V2)
- Analytics réactions (V2)

## Dépendances croisées

| Fonction | Version | Dépend de | Impact |
|----------|---------|-----------|--------|
| F20 Project Updates | V1.5 | F19 | Notifications followers sur nouvelle update |
| F21 Collaboration | V2 | F19, Phase 3 | Invite contributeurs → notifications |
| Feed unifié | — | F11, F07 | **Décision : feeds séparés** |