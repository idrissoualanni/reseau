# GraphQL (Yoga + Pothos) — projets/posts uniquement

Miroir concis de `.claude/rules/api-graphql.md` (source autoritaire). À lire avant toute
modification de la couche GraphQL.

- Périmètre (ADR 0002) : projets/posts en GraphQL ; auth, profil, compétences, recherche, upload en REST. Aucun nouveau domaine GraphQL sans ADR.
- Aucune logique de schéma dans `route.ts` ; un fichier par type métier dans `src/server/graphql/types/`.
- `maskedErrors: true` ; introspection + GraphiQL désactivés en production, actifs en dev.
- Contexte par requête : `{ userId, profileId, loaders }`. L'identité n'est JAMAIS un argument de mutation.
- Résolveurs minces : lire le contexte → valider → UN cas d'usage → renvoyer. Pas de SQL ni règle métier dans un résolveur.
- Visibilité filtrée dans la requête SQL du cas d'usage, jamais après coup ; invisible = `NOT_FOUND`.
- DataLoaders : une instance par requête, une requête SQL par loader (`inArray`, ordre des clés). Test N+1 obligatoire.
- Pagination par curseur opaque (`createdAt`+`id`), `first` ≤ 50, tri stable `created_at DESC, id DESC`.
- Erreurs : `AppError` → `GraphQLError` avec `extensions.code` (`VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`).
- Limites : profondeur 6, complexité bornée, taille/jetons bornés ; jamais désactiver pour tester.
- Entrées validées par les schémas Zod partagés ; le cas d'usage reste la dernière ligne de défense.
- Mutations : un seul argument `input: XxxInput`, renvoie l'objet modifié. Dates en `DateTime` ISO 8601 UTC.
- **Scalars Pothos** : tout scalar personnalisé (ex. `DateTime`) est déclaré AVANT usage dans le générique du `SchemaBuilder` (`Scalars: { DateTime: { Input: Date; Output: Date } }`), sinon TS rejette `type: 'DateTime'` et `instanceof Date`.
- Pas d'upload en GraphQL : URL présignée REST puis `coverKey` dans l'input ; le schéma expose `coverUrl`, jamais la clé.
- `schema.graphql` committé, régénéré par le script d'export (jamais édité à la main).