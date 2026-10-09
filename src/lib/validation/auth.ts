import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Adresse e-mail invalide.").max(254, "Adresse e-mail trop longue."));

export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit faire au moins 8 caractères.")
  .max(128, "Le mot de passe est trop long.");

const otpSchema = z.string().trim().regex(/^\d{6}$/, "Le code doit contenir 6 chiffres.");

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Indique ton nom (2 caractères minimum).")
      .max(60, "Nom trop long."),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const signInSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Renseigne ton mot de passe."),
    next: z.string().optional(),
  })
  .strict();

export const verifyEmailSchema = z
  .object({ email: emailSchema, otp: otpSchema })
  .strict();

export const forgotPasswordSchema = z.object({ email: emailSchema }).strict();

export const resetPasswordSchema = z
  .object({ email: emailSchema, otp: otpSchema, password: passwordSchema })
  .strict();

export { DEFAULT_REDIRECT, safeNextPath } from "@/lib/safe-next";
