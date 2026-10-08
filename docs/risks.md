# Risques et réponses

| Risque | Réponse |
|---|---|
| Réseau vide au démarrage | Valeur utile en solo (profil, projets) ; lancement sur une seule promotion |
| Qualité diluée par l'ouverture | Espaces, statuts vérifiés, visibilité par espace |
| Vie privée (quotidien vu par des recruteurs) | Fil libre séparé des publications structurées ; l'utilisateur contrôle ce qui alimente son profil |
| Profil déduit à tort par l'IA | L'IA propose, l'utilisateur valide ; transparence sur la production des suggestions |
| Crédibilité des compétences | Niveaux de preuve fondés sur des projets et artefacts vérifiables (sans validation humaine) |
| Biais de recherche (recruteurs) | Critères transparents, recherche basée sur des preuves |
| Concurrence d'usage (WhatsApp, LinkedIn) | Différenciation par la preuve et le CV généré |
| Dispersion (trop de modules trop tôt) | Phases séquentielles, périmètre V1 verrouillé |
| Neon Auth / Neon Storage encore en évolution (bêta/préversion selon les pages) | ADR 0003 ; accès isolé derrière `lib/auth` et `lib/storage` pour pouvoir changer de fournisseur |
| Dérive des agents (fonctionnalités ajoutées en continu) | Fiche + plan validé + périmètre V1 verrouillé (`CLAUDE.md`, `docs/workflow.md`) |

## Données personnelles
- Le Sénégal dispose d'une loi sur la protection des données personnelles et d'une autorité de contrôle ; **faire valider les obligations (déclaration, consentement, durée de conservation, hébergement hors du pays) par un juriste avant la mise en production.**
- Dès la V1 : collecter le minimum, lecture des profils réservée aux membres connectés, suppression de compte possible (F10 prévoit la modification ; la suppression est un ajout V1.5 à planifier), aucun journal contenant des données personnelles.
