"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { recordOtpSend } from "@/lib/auth-audit";
import { safeNextPath } from "@/lib/safe-next";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  verifyEmailSchema,
} from "@/lib/validation/auth";

export type FormState = {
  error?: string;
  success?: string;
  email?: string;
  fieldErrors?: Record<string, string>;
};

function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    result[key] ??= issue.message;
  }
  return result;
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  // Turnstile retiré temporairement (pas de domaine, pas de clés réelles).
  // Le bloc de vérification anti-robot sera réintroduit avec F01 / au déploiement prod.

  const auth = getAuth();
  const { error } = await auth.signUp.email(parsed.data);
  const alreadyExists = (error as { code?: string } | null)?.code === "USER_ALREADY_EXISTS";

  // Compte neuf OU compte existant non vérifié : on (re)envoie toujours le code.
  // Sans ce renvoi, un second essai sur la même adresse n'envoyait aucun code.
  const { error: otpError } = await auth.emailOtp.sendVerificationOtp({
    email: parsed.data.email,
    type: "email-verification",
  });
  await recordOtpSend({
    email: parsed.data.email,
    type: "email-verification",
    ok: !otpError,
    errorCode: (otpError as { code?: string } | null)?.code ?? null,
  });

  // Message neutre quand l'adresse existe déjà : ne jamais révéler l'existence
  // d'un compte (F01 règle 7).
  if (error && !alreadyExists) {
    return otpError
      ? { error: "L'inscription n'a pas pu aboutir. Réessaie dans un instant." }
      : { error: "Si cette adresse est valide, tu vas recevoir un code." };
  }

  if (otpError && !alreadyExists) {
    return {
      error: "Ton compte est créé, mais l'envoi du code a échoué. Réessaie l'envoi.",
      email: parsed.data.email,
    };
  }

  redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const { error } = await getAuth().signIn.email({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    if ((error as { code?: string }).code === "EMAIL_NOT_VERIFIED") {
      redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
    }
    return { error: "E-mail ou mot de passe incorrect." };
  }

  redirect(safeNextPath(parsed.data.next));
}

export async function verifyEmailAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = verifyEmailSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), email: String(formData.get("email") ?? "") };
  }

  const { error } = await getAuth().emailOtp.verifyEmail(parsed.data);
  if (error) {
    return { error: "Ce code est invalide ou expiré.", email: parsed.data.email };
  }

  redirect("/");
}

export async function resendVerificationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const { error } = await getAuth().emailOtp.sendVerificationOtp({
    email: parsed.data.email,
    type: "email-verification",
  });
  await recordOtpSend({
    email: parsed.data.email,
    type: "email-verification",
    ok: !error,
    errorCode: (error as { code?: string } | null)?.code ?? null,
  });
  if (error) {
    return {
      error: "L'envoi du code a échoué. Réessaie dans une minute.",
      email: parsed.data.email,
    };
  }
  return { success: "Nouveau code envoyé. Pense à vérifier tes spams.", email: parsed.data.email };
}

export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const { error } = await getAuth().emailOtp.sendVerificationOtp({
    email: parsed.data.email,
    type: "forget-password",
  });
  await recordOtpSend({
    email: parsed.data.email,
    type: "forgot-password",
    ok: !error,
    errorCode: (error as { code?: string } | null)?.code ?? null,
  });
  // Réponse neutre : ne pas révéler si l'adresse existe (F02).
  return {
    success: "Si cette adresse est valide, tu vas recevoir un code.",
    email: parsed.data.email,
  };
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: fieldErrors(parsed.error),
      email: String(formData.get("email") ?? ""),
    };
  }

  const { error } = await getAuth().emailOtp.resetPassword(parsed.data);
  if (error) {
    return { error: "Ce code est invalide ou expiré.", email: parsed.data.email };
  }

  redirect("/sign-in?reset=1");
}

export async function signOutAction(): Promise<void> {
  await getAuth().signOut();
  redirect("/sign-in");
}
