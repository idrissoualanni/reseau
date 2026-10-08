---
description: GraphQL (Yoga + Pothos) pour les projets et les posts. À lire avant de toucher au schéma, aux résolveurs ou au contexte GraphQL.
paths: ["apps/web/src/server/graphql/**", "apps/web/src/app/api/graphql/**", "apps/web/schema.graphql"]
---

# GraphQL (projets / posts uniquement)

## 0. Périmètre : ce qui est en GraphQL et ce qui ne l'est pas

| Domaine | Transport | Pourquoi |
| :-- | :-- | :-- |
| Projets, posts (lecture, création, modification, suppression) | **GraphQL** | Écrans qui croisent beaucoup de relations (auteur, compétences, images, compteurs) |
| Auth, profil, compétences, recherche d'étudiants, upload, URL présignées | **REST** (`app/api/...`) | Opérations simples, une ressource à la fois |
| Messagerie, appels | Hors V1 | Reportés en V2 |

- **Aucun nouveau domaine en GraphQL sans ADR** (`docs/adr/0002-graphql-perimetre.md`). En cas de doute : REST.
- GraphQL et REST appellent **les mêmes cas d'usage** (`application/`). On ne duplique jamais la logique.

## 1. Fichiers et responsabilités

```
apps/web/
├─ schema.graphql                      ← schéma SDL exporté, COMMITTÉ (ne jamais éditer à la main)
└─ src/
   ├─ app/api/graphql/route.ts         ← serveur Yoga uniquement (config, plugins, limites)
   └─ server/graphql/
      ├─ builder.ts                    ← SchemaBuilder Pothos + plugins + types de contexte
      ├─ context.ts                    ← construit { userId, profileId, loaders } depuis la session
      ├─ errors.ts                     ← conversion AppError → GraphQLError (codes)
      ├─ loaders.ts                    ← fabrique des DataLoaders (1 jeu par requête)
      ├─ schema.ts                     ← importe tous les types, appelle builder.toSchema()
      └─ types/
         ├─ project.ts                 ← type Project + queries + mutations du domaine projet
         ├─ post.ts
         ├─ profile.ts                 ← type Profile (lecture seule, utilisé par Project.author)
         ├─ skill.ts
         └─ connection.ts              ← types Connection/PageInfo communs
```

**Règles de rangement**
- Un fichier par type métier dans `types/`. Il contient le type, ses champs, ses queries et ses mutations.
- `route.ts` ne contient **aucune** logique de schéma. `builder.ts` ne contient **aucun** type métier.
- `schema.graphql` est régénéré par `npm run graphql:export` (script qui écrit `printSchema(schema)`).
  **La CI échoue si le fichier committé diffère du schéma généré.** Après toute modification de type : relancer la commande et committer le résultat.

## 2. Serveur Yoga (`route.ts`)

Obligatoire :
- `graphqlEndpoint: '/api/graphql'`, méthodes `GET` et `POST` exportées.
- `maskedErrors: true` : une erreur inattendue ne montre jamais sa cause au client (voir §8).
- **Production** : introspection désactivée (`useDisableIntrospection`), GraphiQL désactivé (`graphiql: false`), suggestions de champs bloquées (`blockFieldSuggestions` de GraphQL Armor).
- **Développement** : GraphiQL activé.
- Limites de requête (GraphQL Armor ou équivalent) : voir §9.
- Pas de `cors` ouvert : seule l'origine du site est autorisée.
- Pas de subscription en V1.

## 3. Contexte (`context.ts`)

```ts
type GraphQLContext = {
  userId: string | null;      // id Neon Auth, null si anonyme
  profileId: string | null;   // profil applicatif lié, null si anonyme
  loaders: Loaders;           // DataLoaders créés pour CETTE requête
};
```

- Construit **à chaque requête** à partir de la session (cookie / jeton Neon Auth). Jamais mis en cache entre deux requêtes.
- **L'identité n'est JAMAIS un argument** : pas de `authorId`, `userId` ou `profileId` dans une mutation. L'auteur est toujours `ctx.profileId`.
- Une requête anonyme est permise **uniquement** pour lire du contenu `public`. Toute mutation exige un utilisateur connecté (`UNAUTHENTICATED` sinon).

## 4. Résolveurs minces

Un résolveur fait exactement quatre choses : **lire le contexte → valider l'entrée → appeler UN cas d'usage → renvoyer le résultat**.

```ts
// types/project.ts (extrait)
builder.mutationField('publishProject', (t) =>
  t.field({
    type: ProjectRef,
    args: { input: t.arg({ type: PublishProjectInput, required: true }) },
    resolve: async (_root, { input }, ctx) => {
      requireAuth(ctx);                                         // UNAUTHENTICATED si anonyme
      return publishProject({ profileId: ctx.profileId!, ...input }); // cas d'usage
    },
  }),
);
```

**Interdit dans un résolveur** : SQL ou appel Drizzle, règle métier, calcul de visibilité, `if` sur le rôle, accès direct à `process.env`. Tout cela vit dans `application/` et `domain/`.

## 5. Visibilité et permissions

- Visibilités : `private` (auteur seul), `space` (membres de l'espace), `connections`, `public`. En V1, seuls `private` et `public` sont exposés ; les autres valeurs sont prévues dans le modèle mais refusées par la validation.
- **Le filtre de visibilité est appliqué dans la requête SQL du cas d'usage** (clause `WHERE` selon le lecteur), jamais après coup dans le résolveur. Sinon les compteurs et la pagination fuient des données.
- Un projet qu'on n'a pas le droit de voir répond `NOT_FOUND` (pas `FORBIDDEN`) pour ne pas révéler son existence. `FORBIDDEN` est réservé aux actions (modifier/supprimer le projet d'un autre).
- Propriété : modifier ou supprimer exige `project.authorId === ctx.profileId`, vérifié dans le cas d'usage.
- Les champs sensibles (e-mail, identifiants Neon Auth) **n'existent pas** dans le schéma GraphQL.

## 6. DataLoader (anti N+1)

- Les loaders sont créés dans `loaders.ts`, **une instance par requête**, et exposés via `ctx.loaders`.
- Obligatoires pour : auteur d'un projet/post, compétences d'un profil, compétences d'un projet, compteurs (likes, commentaires), image de couverture.
- Un loader = **une seule requête SQL** avec `inArray(...)`, qui renvoie les résultats **dans l'ordre des clés reçues** (et `null`/`[]` pour les clés absentes).
- Dans un champ de relation : `resolve: (project, _a, ctx) => ctx.loaders.authorById.load(project.authorId)`.
- **Test obligatoire** (`server/graphql/__tests__/n-plus-one.test.ts`) : exécuter la même requête avec 5 puis 50 projets et vérifier que **le nombre de requêtes SQL est identique** (compteur via le logger Drizzle).

## 7. Pagination

- Style « connection » par curseur : `projects(first: Int!, after: String): ProjectConnection!` avec `edges { cursor node }` et `pageInfo { hasNextPage endCursor }`.
- Curseur **opaque** (base64 d'un couple `createdAt` + `id`), jamais un numéro de page ni un offset.
- `first` ≤ **50** (défaut 20) ; au-delà : `VALIDATION`.
- Tri stable : `ORDER BY created_at DESC, id DESC`. Index SQL correspondant obligatoire.

## 8. Erreurs

Les cas d'usage lèvent des `AppError` typées. `errors.ts` les convertit en `GraphQLError` avec `extensions.code` :

| Code | Quand |
| :-- | :-- |
| `VALIDATION` | Entrée invalide (message lisible + champ concerné dans `extensions.fields`) |
| `UNAUTHENTICATED` | Pas de session |
| `FORBIDDEN` | Connecté mais action interdite |
| `NOT_FOUND` | Ressource absente **ou invisible** pour ce lecteur |
| `CONFLICT` | Doublon, modification concurrente |

- Toute autre exception → message générique « Erreur interne », cause loguée côté serveur (avec identifiant de requête), **jamais** renvoyée au client.
- Le client se base sur `extensions.code`, jamais sur le texte du message.

## 9. Limites de sécurité

- Profondeur maximale : **6**.
- Complexité bornée (coût par champ ; les listes multiplient par `first`).
- Taille maximale du corps de requête et nombre maximal de jetons.
- Pas de requêtes persistées en V1 ; pas d'alias en nombre illimité (limite d'alias/doublons).
- Limitation de débit par utilisateur/IP sur `/api/graphql` (middleware ou Cloudflare).
- Ne jamais désactiver une de ces limites « pour tester » : utiliser l'environnement de dev.

## 10. Validation des entrées

- Les entrées sont validées par les **schémas Zod partagés** (`packages/shared`), les mêmes que ceux du REST et du formulaire côté client.
- Soit via le plugin Zod de Pothos, soit au début du cas d'usage. Dans tous les cas, **le cas d'usage reste la dernière ligne de défense**.
- Contenu texte : longueur maximale, nettoyage (pas de HTML brut accepté).

## 11. Nommage

- Queries : `projects`, `project(id)`, `myProjects`. Mutations : **verbe + objet** (`publishProject`, `updateProject`, `deleteProject`).
- Une mutation prend **un seul argument** `input: XxxInput` (jamais d'arguments en vrac) et renvoie l'objet modifié (ou `{ id }` pour une suppression).
- Types en PascalCase, champs en camelCase, enums en `SCREAMING_SNAKE_CASE`. Chaque champ non évident porte une `description`.
- Dates en `DateTime` ISO 8601 UTC.

## 12. Images et fichiers

- **Pas d'upload de fichier via GraphQL.** Le client appelle l'endpoint REST d'URL présignée, envoie le fichier directement au stockage, puis passe la `coverKey` obtenue dans l'input GraphQL.
- Le cas d'usage vérifie que la `coverKey` appartient bien à l'utilisateur connecté et que l'objet existe.
- Le schéma expose une URL publique calculée (`coverUrl`), jamais la clé interne brute.

## 13. Client (Next.js)

- Requêtes écrites dans des fichiers dédiés (`apps/web/src/graphql/*.graphql` ou `gql`), typées automatiquement depuis `schema.graphql` (codegen).
- Mobile d'abord : demander **uniquement** les champs affichés à l'écran ; pas de fragment géant « tout le projet ».

## 14. Tests

- Tests de schéma via `yoga.fetch` / exécution directe du schéma avec un contexte de test (Vitest). Pas de serveur réseau.
- Pour chaque opération : cas nominal, non connecté, interdit, entrée invalide, ressource invisible.
- Test N+1 (§6) et test du plafond de pagination (§7).
- Vérification que le schéma committé est à jour (`npm run graphql:check`).

## 15. Checklist : ajouter ou modifier une opération

1. Le domaine est-il autorisé en GraphQL (ADR `0002`) ? Sinon → REST.
2. Le **cas d'usage** existe-t-il dans `application/` (avec ses tests) ? Sinon le créer d'abord.
3. Schéma Zod partagé créé/réutilisé pour l'entrée.
4. Type + opération dans `server/graphql/types/<domaine>.ts`, résolveur mince.
5. Relations via DataLoader ; visibilité filtrée dans le SQL.
6. `npm run graphql:export` puis committer `schema.graphql`.
7. Tests : nominal, erreurs, N+1.
8. Mettre à jour le changelog si l'API visible change.
9. donne des explication de ce qui est fait avec graphql et propose une interface de visualisation de l'api graphql pour les developpeurs et les testeurs avec graphiql ou playground 

## 16. Interdits (résumé)

- SQL ou règle métier dans un résolveur.
- Identité (`userId`, `authorId`) en argument.
- Introspection / GraphiQL en production.
- Exposer une erreur interne ou une trace.
- Liste sans pagination ou `first` > 50.
- Relation résolue sans DataLoader.
- Upload de fichier en GraphQL.
- Nouveau domaine GraphQL sans ADR.
- Modifier `schema.graphql` à la main.