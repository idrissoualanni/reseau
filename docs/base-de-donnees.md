# Base de données (Neon)

## Environnements
- **dev** : branche Neon `dev`, utilisée par tous les agents de développement.
- **production** : branche principale. Accès uniquement via migrations validées par moi.
- Une tâche risquée peut avoir sa propre branche Neon jetable (comme son worktree).

## Connexions
- Application : URL poolée (`DATABASE_URL`).
- Migrations : URL directe (`DATABASE_URL_UNPOOLED`).

## Premier schéma (proposition, à valider en phase 1)
- `users` : id, e-mail, nom affiché, créé le, supprimé le
- `organizations` : id, nom, type (université, entreprise…)
- `profiles` : id, user_id, type (étudiant, entrepreneur…), données spécifiques (JSON), visibilité
- `activities` : id, user_id, contenu, créé le
- `skills` : id, nom ; `user_skills` : user_id, skill_id, source (déduite/saisie), validée (booléen)
- `connections` : id, demandeur, destinataire, statut
- `device_keys` : user_id, id d'appareil, clé PUBLIQUE uniquement
- `conversations`, `conversation_members`
- `messages` : id, conversation_id, expéditeur, **contenu chiffré**, nonce, envoyé le
  (aucune donnée en clair, métadonnées minimales)

## Règles
- Toute modification de schéma = un fichier de migration versionné, relu avant application hors dev.
- Pas de suppression de colonne/table/données sans demande explicite.
- Index pour les listes paginées (fil, membres, messages).
- Suppression de compte = suppression réelle des données associées.
-quand la version dev sera valider on pourra utiliser la branche de production 
