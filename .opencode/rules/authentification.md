# Authentification — règles (miroir de `.claude/rules/authentification.md`)

- **Envoi du code OTP.** `auth.signUp.email()` **n'envoie rien** tant que
  `verify_email_on_sign_up` est `false`. Toujours appeler
  `auth.emailOtp.sendVerificationOtp({ email, type: "email-verification" })`.
- **Compte déjà existant.** `USER_ALREADY_EXISTS` : renvoyer quand même le code puis
  router vers `/verify-email`.
- **Message neutre.** Ne jamais révéler l'existence d'un compte.
- **Erreurs visibles.** Contrôler l'erreur de `sendVerificationOtp` (ne jamais l'ignorer).
- **Délai anti-spam.** 60 s entre deux renvois.
- **Layout.** Sidebar dans `(app)` uniquement ; les pages d'auth (`(auth)`) n'ont ni
  sidebar ni top bar.
- **Garde de vérification.** Page connectée ⇒ e-mail vérifié : `emailVerified === false`
  ⇒ redirection `/verify-email` (`src/lib/auth-guard.ts`). Fail-open si champ absent.
- **Journal des envois OTP.** `auth_otp_audit` trace les envois (adresse, type, résultat,
  date), **best-effort**, **jamais le code**, jamais bloquant. Exception tracée
  (`security.md`) : l'e-mail de destination y est autorisé, réservé à l'admin plateforme ;
  définir une rétention (purge) — `docs/TODO.md`.
- **Mot de passe.** Utiliser `PasswordField` (bouton afficher/masquer).
