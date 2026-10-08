# F02 — Se connecter

- **Version** : V1 · **Dépend de** : F01 · **Agents** : backend, frontend, qa, security
- **Objectif** : se connecter, rester connecté, se déconnecter, récupérer son mot de passe.
- **User story** : En tant que membre, je veux me connecter pour retrouver mon espace.

## Règles métier
1. Connexion par e-mail + mot de passe (`auth.signIn.email`).
2. E-mail non vérifié → redirection vers `/verify-email` avec renvoi de code.
3. Session maintenue par le SDK ; **middleware** (`auth.middleware`) protège toutes les routes sauf `/sign-in`, `/sign-up`, `/verify-email`, `/forgot-password`, assets, `/api/health`.
4. Utilisateur connecté sans profil → redirection `/onboarding/profile` (F03).
5. Déconnexion : bouton dans le menu ; invalide la session.
6. **Mot de passe oublié** : saisie e-mail → code de réinitialisation → nouveau mot de passe (flux « forget-password » Neon Auth).
7. Message d'erreur identique pour e-mail inconnu et mot de passe faux.

## Écrans / routes
`/sign-in` · `/forgot-password` · redirection vers la page demandée après connexion (paramètre `next`, limité aux chemins internes).

## API
Neon Auth handler + actions serveur `signIn`, `signOut`.

## Données
Aucune table applicative.

## Validation (Zod)
`email` · `password` non vide · `next` : chemin relatif commençant par `/` uniquement (anti open-redirect).

## Erreurs
| Cas | Code | Message |
|---|---|---|
| Identifiants invalides | UNAUTHENTICATED | « E-mail ou mot de passe incorrect. » |
| E-mail non vérifié | FORBIDDEN | « Vérifie ton e-mail pour continuer. » |
| Trop d'essais | RATE_LIMITED | « Trop d'essais, réessaie plus tard. » |

## Sécurité
Limitation de débit sur la connexion. `next` validé. Aucune information sur l'existence du compte.

## Critères d'acceptation
- [ ] Un membre vérifié se connecte et atteint la page demandée.
- [ ] Un visiteur non connecté est redirigé vers `/sign-in` depuis toute page protégée.
- [ ] La déconnexion supprime l'accès aux pages protégées.
- [ ] Le flux « mot de passe oublié » aboutit à une connexion avec le nouveau mot de passe.
- [ ] Un `next` externe est ignoré.

## Tests attendus
Unitaires : validation de `next`, garde de session. E2E : connexion / déconnexion / accès protégé.

## Hors périmètre
Connexion sociale, double authentification, gestion des appareils.
