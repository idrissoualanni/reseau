# Profils, statuts, espaces

## Un compte, un profil
`profiles` est le noyau commun. Ce qui varie : **statuts**, **rôles**, **appartenances** (V1.5). Jamais de comptes séparés par type d'utilisateur.

## Espaces (V1.5, documentés maintenant pour ne pas refaire le schéma)
Un **espace** est un lieu du réseau avec membres, fil et règles : université, filière, communauté thématique. Une personne peut appartenir à plusieurs espaces ; chaque **appartenance** a un rôle et un niveau de vérification.

## Accéder à l'espace de son université : méthodes interchangeables
Toutes les universités n'ont pas d'e-mail institutionnel. La **méthode d'accès est donc une configuration de l'espace**, pas du code figé. Chaque espace déclare une ou plusieurs méthodes (`space_access_methods`) :

| Méthode | Fonctionnement | Niveau de vérification obtenu |
|---|---|---|
| `email_domain` | L'étudiant confirme un e-mail dont le domaine est autorisé (ex. `@univ.sn`) | `verified` |
| `invite_code` | L'étudiant saisit un code donné par l'établissement | `verified` |
| `invite_link` | Lien d'invitation à usage multiple, expirant | `verified` |
| `manual_approval` | L'étudiant demande l'accès, un admin d'espace approuve | `verified` après approbation |
| `open` | Accès libre (espaces thématiques publics) | `unverified` |

Règles :
- Ajouter une méthode = implémenter l'interface `AccessMethod` (`packages/shared`) + une ligne de configuration. Aucune modification des cas d'usage existants.
- L'étudiant choisit parmi les méthodes que **l'espace** propose.
- Le statut « étudiant vérifié » est porté par l'appartenance (`membership.verification_level`, `verified_via`), pas par le compte.
- Tout accès est journalisé (qui, quand, quelle méthode).

## Rôles (appartenance)
`member` · `space_admin` · (V3) `recruiter`, `entrepreneur`, `mentor`. Les rôles sont des lignes de données, pas des branches de code éparpillées.

## Visibilité d'un contenu
`private` (auteur) · `space` (un espace) · `connections` (V2+) · `public` (toute personne connectée en V1 ; web ouvert plus tard).
En V1, la colonne existe mais seules `private`/brouillon et « publié visible aux membres connectés » sont exposées.
