"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { verifyTurnstile } from "@/lib/turnstile";
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

async function clientIp(): Promise<string | undefined> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || undefined;
}

function turnstileToken(formData: FormData): string {
  return String(formData.get("cf-turnstile-response") ?? "");
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

  const token = turnstileToken(formData);
  if (!token || !(await verifyTurnstile(token, await clientIp()))) {
    return { error: "Vérification anti-robot échouée, réessaie." };
  }

  const auth = getAuth();
  const { error } = await auth.signUp.email(parsed.data);
  if (error) {
    // Message neutre : ne jamais révéler l'existence d'un compte (F01 règle 7).
    return { error: "Si cette adresse est valide, tu vas recevoir un code." };
  }

  await auth.emailOtp.sendVerificationOtp({
    email: parsed.data.email,
    type: "email-verification",
  });

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

  await getAuth().emailOtp.sendVerificationOtp({
    email: parsed.data.email,
    type: "email-verification",
  });
  return { success: "Nouveau code envoyé.", email: parsed.data.email };
}

export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  await getAuth().emailOtp.sendVerificationOtp({
    email: parsed.data.email,
    type: "forget-password",
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
