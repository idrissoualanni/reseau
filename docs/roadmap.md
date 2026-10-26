# Feuille de route

Correspondance avec les phases du document de cadrage initial.

| Version | Contenu | Cadrage |
|---|---|---|
| **V1** | Compte, connexion (vérif. e-mail), profil, compétences, projets (texte + image), consultation, recherche par compétence | Phase 0 + noyau phase 1 |
| **V1.5** | Espaces + accès université (méthodes configurables) · fil libre texte/image/**vidéo** · publications structurées (appris/construit/participé/obtenu) · niveau `verifiable` · suggestions IA · **CV et portfolio générés puis modifiables** | Reste phase 1 |
| **V2** | **Messagerie chiffrée 1-1** (Neon Realtime + Neon Functions) · galerie 5 images · séparation admin | Phase 2 (partie) |
| **V2.5** | Connexions · pièces jointes · groupes · blocage/signalement | Phase 2 |
| **V3** | **Appels WebRTC** · espace recruteur · tableau de bord université · module entrepreneur | Phases 2–3 |

## Périmètre V1 (minimal)
Les 10 fonctionnalités de `features/F01…F10`. Hors périmètre V1 : espaces, fil libre, vidéo, CV, portfolio, IA, connexions, messagerie, appels, recruteurs.

## Préparer sans construire
Le schéma V1 est conçu pour que V1.5 soit **additif** (nouvelles tables/colonnes nullables). Les tables futures sont documentées dans `data-model.md` mais **non migrées**.

## CV et portfolio (V1.5) — modifiables
- Le CV est généré depuis profil + compétences + projets, stocké comme **document structuré en sections** (JSON).
- L'utilisateur peut éditer, réordonner, masquer toute section et tout texte.
- Une section modifiée à la main est marquée `edited` : une régénération **ne l'écrase jamais** sans confirmation.
- Export PDF et lien de partage. Le portfolio public est la version visuelle, avec les mêmes règles d'édition.

## Fil libre et vidéo (V1.5)
- Fil libre : texte, image, vidéo. N'alimente **pas** le profil professionnel par défaut.
- Vidéo : format proposé dans `open-decisions.md` (durée, poids, encodage, hébergement).
