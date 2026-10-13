---
description: Parcours d'authentification (Neon Auth / Managed Better Auth)
---
# Authentification — règles vérifiées

- **Envoi du code OTP.** `auth.signUp.email()` **n'envoie rien** tant que
  `verify_email_on_sign_up` est `false` (config actuelle de la branche `dev`).
  Toujours appeler explicitement
  `auth.emailOtp.sendVerificationOtp({ email, type: "email-verification" })`.
- **Compte déjà existant.** `signUp.email` renvoie `USER_ALREADY_EXISTS`. Ne pas
  s'arrêter là : **renvoyer quand même le code** puis router vers `/verify-email`.
  Sinon un second essai sur la même adresse n'envoie aucun code (bug vécu).
- **Message neutre.** Ne jamais révéler l'existence d'un compte : même texte et même
  destination quel que soit le résultat (F01 règle 7).
- **Erreurs visibles.** Ne jamais ignorer l'`error` de `sendVerificationOtp` : la
  remonter à l'utilisateur (« renvoie le code plus bas ») au lieu de rediriger en
  silence.
- **Délai anti-spam.** 1 renvoi autorisé par minute : bouton désactivé pendant 60 s
  côté client (`/verify-email`). Le partagé SMTP Neon est en plus rate-limité.
- **SMTP partagé = dev uniquement** (`auth@mail.myneon.app`, rate-limité, codes OK,
  liens non supportés). SMTP dédié obligatoire en production.
- **Domaines de confiance.** Ajouter les origines staging + prod avant de déployer ;
  `localhost` est pré-autorisé. Les OAuth/redirections échouent sinon.
- **Mot de passe.** Toujours un champ avec bascule afficher/masquer
  (`src/components/password-field.tsx`), jamais un `<input type="password">` nu.
- **Layout.** La sidebar vit dans `src/app/(app)/layout.tsx` (pages connectées).
  Les pages d'auth (groupe `(auth)`) n'ont **ni sidebar ni top bar**.
- **Garde de vérification.** Toute page connectée exige un e-mail vérifié : si
  `session.user.emailVerified === false`, redirection vers `/verify-email`
  (`src/lib/auth-guard.ts` dans `(app)/layout.tsx`). Fail-open si le champ est absent.
- **Journal des envois OTP.** Les envois (`emailOtp.sendVerificationOtp`) sont tracés en
  base (`auth_otp_audit` : adresse, type, résultat, date) de façon **best-effort** :
  jamais le code, jamais bloquant. Le code OTP n'est **jamais** stocké ni affiché
  (Neon Auth gère l'envoi ; l'app ne le reçoit pas).
- **Raccord après vérification.** `/verify-email` → `/` → `/onboarding/profile` si
  aucun profil. `signIn` renvoie vers `/verify-email` sur `EMAIL_NOT_VERIFIED`.
