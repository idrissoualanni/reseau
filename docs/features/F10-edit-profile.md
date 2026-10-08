# F10 — Modifier son profil

- **Version** : V1 · **Dépend de** : F03, F04 · **Agents** : backend, frontend, qa
- **Objectif** : mettre à jour ses informations de profil.
- **User story** : En tant que membre, je veux modifier mon profil, afin qu'il reste à jour.

## Règles métier
1. Modifiables : `display_name`, `bio`, `school_name`, `field_of_study`, avatar (remplacer ou retirer).
2. **Non modifiable en V1** : `username` (URL stable), e-mail et mot de passe (gérés par Neon Auth ; interface de changement planifiée en V1.5).
3. Seul le propriétaire modifie son profil ; `user_id` pris dans la session.
4. Remplacer ou retirer l'avatar supprime l'ancien fichier du stockage.
5. Mise à jour partielle : seuls les champs envoyés changent.
6. Les compétences se gèrent depuis la même page (F04).

## Écrans / routes
`/me/profile` (formulaire + compétences). Fiche UX : `docs/ux/profile-edit.md`.

## API
REST : `PATCH /api/me/profile` `{ display_name?, bio?, school_name?, field_of_study?, avatar_key? | null }` → profil mis à jour.

## Validation (Zod)
Mêmes règles que F03 (sans `username`). Champ inconnu (`username`, `user_id`…) → rejeté (`strict()`).

## Erreurs
Validation par champ ; `FORBIDDEN` si profil d'un autre ; `NOT_FOUND` si pas de profil.

## Critères d'acceptation
- [ ] Un membre modifie son nom et sa bio ; le changement est visible sur `/u/[username]`.
- [ ] Une tentative d'envoyer `username` est rejetée.
- [ ] Remplacer l'avatar supprime l'ancien fichier.
- [ ] Un membre ne peut pas modifier le profil d'un autre (test explicite).
- [ ] Les erreurs s'affichent sous les champs, la saisie est conservée.

## Tests attendus
Unitaires : mise à jour partielle, champs interdits, propriété. E2E : modifier et vérifier sur la page publique.

## Hors périmètre
Changement d'e-mail/mot de passe, suppression de compte (à planifier avant production, `open-decisions.md` n°10), confidentialité par champ, CV/portfolio.
