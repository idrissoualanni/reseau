# Modèle de preuve des compétences

Objectif : un profil crédible, sans « CV gonflé ». **Pas de validation par les pairs ni par les enseignants.**

| Niveau | Code | Description | V1 |
|---|---|---|---|
| 1 | `declared` | L'utilisateur dit qu'il sait | ✅ |
| 2 | `demonstrated` | Rattachée à au moins un projet **publié** de l'utilisateur | ✅ (calcul automatique) |
| 3 | `verifiable` | Liée à un artefact contrôlable : dépôt de code, certificat, projet en ligne (lien) | V1.5 |

## Règles
- Le niveau n'est jamais saisi à la main sauf `declared`. `demonstrated` est **dérivé** : quand un projet publié porte l'étiquette de la compétence, le niveau passe à 2 ; il redescend si plus aucun projet publié ne la porte.
- `verifiable` (V1.5) exige un lien d'artefact valide ; vérification technique du lien (domaine connu, réponse HTTP), pas d'avis humain.
- Le niveau le plus haut atteint s'affiche sur le profil et dans la recherche (tri : niveau décroissant, puis récence).
- **Suggestions IA (V1.5+)** : l'IA *propose* des compétences à partir des publications ; l'utilisateur accepte ou refuse chaque suggestion ; rien n'est ajouté sans acceptation.
