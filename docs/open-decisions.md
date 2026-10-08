# Décisions ouvertes et valeurs par défaut retenues

Les **défauts** sont appliqués tant que tu ne les modifies pas ; chacun est réversible via un ADR.

| # | Sujet | Défaut retenu | Statut |
|---|---|---|---|
| 1 | Monorepo | npm workspaces : `apps/web`, `packages/db`, `packages/shared` | Défaut |
| 2 | Vérification e-mail | Code à 6 chiffres (OTP) via Neon Auth, SMTP partagé | Défaut |
| 3 | Référentiel de compétences | Création libre normalisée (slug) ; liste de départ ~100 compétences à fournir | Ouvert |
| 4 | Nom du produit | « Réseau » (provisoire) | **Ouvert** |
| 5 | Identité visuelle | Base neutre, couleur à choisir | **Ouvert** |
| 6 | Langues | Français d'abord ; place des langues locales à définir | Ouvert |
| 7 | Modèle économique | Non tranché (pistes : abonnement université, accès recruteurs, gratuit étudiants) | Ouvert |
| 8 | Rôle exact de l'IA (V1.5) | Suggestions uniquement, validées par l'utilisateur ; modèle et données analysées à définir | Ouvert |
| 9 | Module entrepreneur (V3) | Annuaire de ressources, mentorat, mises en relation = trois produits ; lequel d'abord ? | Ouvert |
| 10 | Suppression de compte | À planifier avant production (obligation probable) | Ouvert |
| 11 | Maturité Neon Auth/Storage | À confirmer dans la console ; isolées derrière `lib/auth`, `lib/storage` | À vérifier |
| 12 | Cloudflare devant Neon Storage | Compatibilité domaine/bucket à vérifier | À vérifier |

## Format vidéo proposé (V1.5, fil libre)
À valider avant la V1.5.
- Conteneur/codecs : MP4, H.264 + AAC.
- Durée max : 60 s. Poids max : 50 Mo. Orientation libre, cadrage vertical 9:16 recommandé sur mobile.
- Une image d'aperçu (poster) générée à l'upload.
- Transcodage en plusieurs qualités (480p minimum) pour les connexions faibles : **Cloudflare Stream** (service géré, coût par minute) ou lecture directe du fichier Neon Storage (plus simple, pas d'adaptation de débit). Recommandation : démarrer sans transcodage, avec limites strictes, puis passer à Stream si l'usage le justifie.
- Lecture : pas de lecture automatique avec son ; mode économie de données (pas de préchargement).
- Modération/signalement prévus avant ouverture publique.
