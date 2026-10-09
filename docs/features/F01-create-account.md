# F01 — Créer son compte

- **Version** : V1 · **Dépend de** : — · **Agents** : backend, frontend, qa, security
- **Objectif** : permettre à une personne de s'inscrire avec e-mail et mot de passe, puis de vérifier son e-mail.
- **User story** : En tant que visiteur, je veux créer un compte, afin d'accéder au réseau.

## Règles métier
1. Inscription par **e-mail + mot de passe + nom** via Neon Auth (`auth.signUp.email`).
2. **Vérification de l'e-mail par code à 6 chiffres** envoyé par Neon Auth (SMTP partagé).
   `verify_email_on_sign_up` valant `false`, l'action appelle explicitement
   `auth.emailOtp.sendVerificationOtp`. Le compte n'accède pas à l'application tant que
   l'e-mail n'est pas vérifié.
3. Après vérification : redirection vers la création du profil (F03).
4. Le code expire (durée fixée par Neon Auth) ; l'utilisateur peut demander un nouvel envoi
   (limité : 1 par minute, délai affiché sur `/verify-email`).
5. Mot de passe : 8 caractères minimum (règle d'affichage ; les règles finales viennent de Neon Auth). Le champ propose un bouton **afficher/masquer** (`PasswordField`).
6. Anti-robot : **Cloudflare Turnstile** validé côté serveur avant l'appel d'inscription.
   *En attente* (aucun domaine ni clé réelle) — voir `docs/TODO.md`.
7. Message neutre si l'e-mail existe déjà, **et renvoi quand même du code** : un second essai
   sur la même adresse doit pouvoir aboutir à la vérification, sans révéler l'existence du compte.

## Écrans / routes
`/sign-up` (formulaire) → `/verify-email` (saisie du code, renvoi avec délai) → `/onboarding/profile` (F03).

## API
Handler Neon Auth `app/api/auth/[...path]/route.ts` (`auth.handler()`). Action serveur `signUp` : valide Zod, appelle `auth.signUp.email`, puis `auth.emailOtp.sendVerificationOtp` (même si le compte existe déjà).

## Données
Aucune table applicative. Compte géré par Neon Auth.

## Validation (Zod)
`email` e-mail valide ≤ 254 · `password` 8–128 · `name` 2–60 · `turnstileToken` requis.

## Erreurs
| Cas | Code | Message |
|---|---|---|
| Entrée invalide | VALIDATION | Champ concerné + règle |
| Turnstile invalide | FORBIDDEN | « Vérification anti-robot échouée, réessaie. » *(en attente)* |
| E-mail déjà utilisé | (neutre) | « Si cette adresse est valide, tu vas recevoir un code. » **+ renvoi du code** |
| Échec d'envoi du code | FORBIDDEN | « L'envoi du code a échoué. Réessaie dans une minute. » |
| Code incorrect/expiré | VALIDATION | « Ce code est invalide ou expiré. » |
| Trop de tentatives | RATE_LIMITED | « Trop d'essais, réessaie dans quelques minutes. » |

## Sécurité
Limitation de débit Cloudflare sur `/api/auth/*`. Aucun mot de passe ni code dans les logs. Cookies de session gérés par le SDK Neon Auth.

## Critères d'acceptation
- [ ] Un visiteur crée un compte, reçoit un code, le saisit, et arrive sur la création de profil.
- [ ] Un code faux affiche une erreur sans révéler d'information.
- [ ] Sans vérification, l'accès aux pages protégées est refusé.
- [ ] Turnstile invalide bloque l'inscription.
- [ ] Le formulaire est utilisable à 360 px et au clavier.

## Tests attendus
Unitaires : validation Zod, logique de renvoi. E2E : inscription complète (code via environnement de test).

## Hors périmètre
Connexion sociale (Google…), vérification du statut étudiant / université (V1.5), suppression de compte.
