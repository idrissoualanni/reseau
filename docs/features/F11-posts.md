# F11 — Posts et commentaires

- **Version** : V1 · **Dépend de** : F05, F07 · **Agents** : backend, frontend, designer, qa
- **Objectif** : publier des posts (activités) et les commenter, avec réponses imbriquées.
- **User story** : En tant que membre, je veux publier un activity et en discuter avec la communauté.

## Règles métier
1. Un post appartient à un membre (auteur = session, jamais d'argument).
2. **Commentaires** : tout membre connecté peut commenter un post.
3. **Réponses** : un commentaire peut recevoir des réponses (commentaire d'un commentaire), à un niveau de profondeur illimité mais affiché avec indentation (max 3 niveaux visuels, puis « voir plus »).
4. Les commentaires et réponses sont en texte brut (pas de HTML), longueur max 1000 caractères.
5. Suppression : l'auteur d'un commentaire peut le supprimer (ses réponses sont retirées en cascade).
6. Aucune donnée privée exposée dans les commentaires (pas d'e-mail, pas d'identifiant interne).

## Écrans / routes
- `/posts` (fil groupé par jour, en lecture) · `/posts/new` (composition dédiée) · `/posts/[id]` (détail + commentaires).
- `/posts/[id]/edit` (édition par l'auteur) · `/me/posts` (gestion, pagination « Voir plus »).
- Fiche UX : `docs/ux/posts.md`.

## API
- GraphQL (ADR 0002) : `posts`, `post(id)`, `createPost`, `updatePost`, `deletePost`, `addComment`, `deleteComment`, `togglePostLike`. Les réponses utilisent `addComment` avec `parentId` (pas de mutation `addReply` dédiée à ce jour).
- `Post.likeCount`, `Post.hasLiked` et `PostLikePayload` exposent les j'aime ; DataLoader par lot (anti N+1).
- Relations (auteur, commentaires, j'aime) via DataLoader.

## Données
- `posts` (id, author_id, body, image_key NULL, created_at, updated_at)
- `post_comments` (id, post_id, parent_id NULL, author_id, body, created_at, updated_at) — `parent_id` = NULL pour un commentaire de post, non-NULL pour une réponse.
- `post_likes` (post_id, profile_id, created_at), clé primaire composite — migration `0010_post_likes.sql`.

## Critères d'acceptation
- [x] Un membre publie un post et le voit dans le fil.
- [x] Un membre commente un post ; un autre répond à ce commentaire.
- [x] Les réponses sont affichées avec indentation (max 3 niveaux visuels).
- [x] L'auteur supprime son commentaire ; les réponses sont retirées en cascade.
- [x] Aucune donnée privée dans les réponses API.
- [x] Le fil est groupé par jour (« Aujourd'hui », « Hier », puis la date) sans fusionner deux jours.
- [x] Publier se fait sur une page dédiée `/posts/new` ; après publication, retour au fil avec le post mis en évidence.
- [x] L'auteur modifie le texte et l'image de son post depuis `/posts/[id]/edit`.
- [x] Les posts possèdent un bouton « J'aime » persistant (compteur et état par membre).
- [x] L'espace `/me/posts` liste les posts de l'auteur, permet l'édition, la suppression et la pagination.
- [x] Le composeur et l'éditeur utilisent le composant shadcn `attachment` pour la pièce jointe image.

## Tests attendus
Unitaires : création, édition, j'aime, réponse, cascade de suppression, **groupement temporel du fil** (`posts-grouping.test.ts`). Intégration : requête avec jeu de données et propagation des j'aime. E2E : publier (page dédiée) → retour au fil → aimer → commenter → répondre → modifier → supprimer.

## Hors périmètre
Commentaires riches (images, mentions), modération, vidéo.