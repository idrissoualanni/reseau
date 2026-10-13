// Garde de vérification de compte (F17) : une page connectée exige un e-mail vérifié.
// Fail-open si le champ est absent : on n'enferme jamais un compte existant.
export function isEmailVerified(user: { emailVerified?: boolean | null }): boolean {
  return user.emailVerified !== false;
}
