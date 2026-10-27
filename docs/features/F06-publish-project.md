# F06 — Publier un projet (texte + image)

- **Version** : V1 · **Dépend de** : F05 · **Agents** : backend, frontend, designer, qa, security
- **Objectif** : rendre un projet visible des autres membres, avec une image de couverture, et mettre à jour les preuves de compétence.
- **User story** : En tant que membre, je veux publier mon projet avec une image, afin de le montrer à la communauté.

## Règles métier
1. Publier = passer `draft → published`, poser `published_at`. Titre et texte obligatoires ; l'**image est optionnelle** mais recommandée.
2. **Dépublier** = `published → draft` ; le projet disparaît des listes.
3. Image de couverture (V1.5 : galerie de 5 images maximum) : JPEG/PNG/WebP, **≤ 5 Mo**, dimension max 4000 px. Le serveur n'accepte que les types autorisés. La première image est la couverture (`projects.cover_key`), les 4 suivantes vivent dans `projects.image_keys` (tableau ordonné, `cardinality ≤ 4`, migration 0012 additive).
4. Upload **présigné** : le navigateur envoie directement le fichier à Neon Storage. Le serveur ne relaie pas l'image.
5. La clé de l'image est `projects/{profileId}/{uuid}.{ext}` ; le serveur vérifie qu'elle appartient à l'utilisateur avant de l'enregistrer.
6. À la publication / dépublication : recalcul des niveaux `demonstrated` des compétences étiquetées (`proof-model.md`).
7. Remplacer l'image supprime l'ancienne.

## Écrans / routes
Bouton « Publier » dans l'éditeur (F05) avec aperçu de la carte. Composant `ImageUploader` (aperçu, progression, erreur).

## API
REST : `POST /api/uploads/presign` `{ kind: "project-cover"|"avatar", contentType, size }` → `{ uploadUrl, key, expiresIn }` (expire en ≤ 5 min).
GraphQL : `publishProject(id)`, `unpublishProject(id)`.

## Données
`projects.status`, `published_at`, `cover_key`. Bucket privé ou `public_read` (à trancher dans l'ADR 0004 selon la compatibilité Cloudflare).

## Validation
`contentType` ∈ {`image/jpeg`,`image/png`,`image/webp`} · `size` ≤ 5 242 880 · `kind` énuméré · la clé doit correspondre au préfixe de l'utilisateur.

## Erreurs
| Cas | Code | Message |
|---|---|---|
| Type/poids invalide | VALIDATION | « Image JPEG, PNG ou WebP de 5 Mo maximum. » |
| URL expirée | VALIDATION | « L'envoi a expiré, réessaie. » |
| Titre/texte vides | VALIDATION | « Complète le titre et le texte avant de publier. » |
| Non propriétaire | FORBIDDEN | « Tu ne peux pas publier ce projet. » |

## Sécurité
Liste blanche de types ; taille vérifiée à la signature ; clé liée à l'utilisateur ; aucun nom de fichier fourni par le client dans la clé ; limitation de débit Cloudflare sur `/api/uploads/*`. Les images ne sont jamais interprétées comme du HTML.

## Critères d'acceptation
- [ ] Un membre publie un projet avec image : il apparaît dans la liste (F07) et sur son profil (F08).
- [ ] Une image `.gif` ou de 8 Mo est refusée avec message clair.
- [ ] Dépublier retire le projet des listes ; les compétences repassent à `declared` si aucun autre projet publié ne les porte.
- [ ] Publier sans titre est impossible.
- [ ] Une clé d'image d'un autre utilisateur est refusée.

## Tests attendus
Unitaires : règles de publication, validation de clé, recalcul de preuve. Intégration : transitions de statut. E2E : upload + publication (stockage de dev).

## Hors périmètre
Vidéo, galerie multi-images, recadrage avancé, planification de publication, modération automatique.
