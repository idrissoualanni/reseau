# F08 — Consulter le profil d'un étudiant

- **Version** : V1 · **Dépend de** : F03, F04, F06 · **Agents** : backend, frontend, designer, qa
- **Objectif** : voir le profil d'un membre : identité, compétences avec niveau de preuve, projets publiés.
- **User story** : En tant que membre, je veux consulter le profil d'un autre étudiant, afin d'évaluer ce qu'il sait faire.

## Règles métier
1. URL stable : `/u/[username]`. Accessible aux membres connectés.
2. Contenu : avatar, nom, `username`, bio, établissement, filière, **compétences avec badge de niveau** (`declared`/`demonstrated`), **projets publiés** (liste paginée, plus récents d'abord) et **posts** de l'auteur.
3. Tri des compétences : niveau décroissant, puis nom.
4. Un membre voit en plus des boutons de gestion sur **son propre** profil (modifier, nouveau projet, gérer projets/posts, nouveau post).
5. Aucun projet brouillon n'est visible d'un tiers.
6. `username` inconnu → page « Profil introuvable ».
7. Les e-mails et identifiants internes ne sont **jamais** exposés.

## Écrans / routes
`/u/[username]`. Fiche UX : `docs/ux/profile.md`.

## API
Rendu serveur : appel direct du cas d'usage `getProfileByUsername`. REST client : `GET /api/profiles/{username}` → `{ profile, skills[] }`. Projets : GraphQL `projects(authorUsername:…)`.

## Données
`profiles`, `user_skills`, `skills`, `projects`.

## Critères d'acceptation
- [ ] Le profil d'un autre membre s'affiche avec compétences, badges, projets publiés et posts.
- [ ] Le profil n'expose ni e-mail ni identifiant interne (vérifié dans la réponse).
- [ ] Un username inconnu affiche « Profil introuvable » (404).
- [ ] Sur son propre profil, un membre voit les actions de gestion ; sur un autre, non.
- [ ] La page se charge correctement à 360 px, sans défilement horizontal.

## Tests attendus
Unitaires : mapping de sortie (aucun champ privé). Intégration : requête profil. E2E : liste → profil.

## Hors périmètre
Suivre / se connecter à un membre (V2), CV et portfolio (V1.5), statistiques de visites, signalement.
