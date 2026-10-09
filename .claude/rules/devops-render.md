---
description: Pièges Render vérifiés — service suspendu, pagination env-vars, suppression
---
# Render — pièges vérifiés

- **Service suspendu** : un service web Render peut être suspendu (inactivité ou action
  manuelle). Avant tout déploiement, vérifier le statut via `GET /v1/services/{id}` ;
  si `suspended`, le réactiver via `POST /v1/services/{id}/resume` avant de deployer.
- **Pagination env-vars** : `GET /v1/services/{id}/env-vars` renvoie une liste paginée
  avec un `cursor`. Un parsing naïf renvoie le premier lot seulement. Itérer jusqu'à
  épuisement du curseur ; lever une exception si le décompte est incohérent.
- **Suppression de service** : la suppression est irréversible. Confirmer l'identifiant
  exact (`srv-…`) avant `DELETE /v1/services/{id}` ; jamais de suppression automatique.
- **Cible dev** : le service `reseau` (`srv-db4ek92jnfac73b4uij0`) sur la branche `dev`.
  Tout déploiement dev passe par ce service — jamais par un autre.
