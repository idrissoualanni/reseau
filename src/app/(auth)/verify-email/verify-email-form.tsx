"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { resendVerificationAction, verifyEmailAction, type FormState } from "@/lib/actions/auth";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

const initialState: FormState = {};
const RESEND_DELAY_SECONDS = 60;

export function VerifyEmailForm() {
  const email = useSearchParams().get("email") ?? "";
  const [state, formAction, pending] = useActionState(verifyEmailAction, initialState);
  const [resendState, resendAction, resendPending] = useActionState(
    resendVerificationAction,
    initialState,
  );
  // Le code d'inscription vient d'être envoyé : on démarre le délai tout de suite.
  const [cooldown, setCooldown] = useState(RESEND_DELAY_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  if (!email) {
    return (
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold tracking-tight">Adresse manquante</h1>
          <CardDescription>
            Impossible de vérifier ton compte sans adresse e-mail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/sign-up">Créer un compte</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-semibold tracking-tight">Vérifie ton e-mail</h1>
        <CardDescription>
          Un code à 6 chiffres a été envoyé à <span className="font-medium">{email}</span>. Pense à
          vérifier tes spams.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={formAction} className="flex flex-col gap-4">
          {state.error ? (
            <p role="alert" aria-live="polite" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}
          <input type="hidden" name="email" defaultValue={email} />
          <FormField
            label="Code de vérification"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            error={state.fieldErrors?.otp}
          />
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Vérification…" : "Vérifier mon compte"}
          </Button>
        </form>

        <form
          action={resendAction}
          onSubmit={() => setCooldown(RESEND_DELAY_SECONDS)}
          className="flex flex-col gap-3"
        >
          {resendState.error ? (
            <p role="alert" aria-live="polite" className="text-destructive text-sm">
              {resendState.error}
            </p>
          ) : resendState.success ? (
            <p role="status" className="text-muted-foreground text-sm">
              {resendState.success}
            </p>
          ) : null}
          <input type="hidden" name="email" defaultValue={email} />
          <Button type="submit" variant="outline" disabled={resendPending || cooldown > 0}>
            {cooldown > 0
              ? `Renvoyer un code (${cooldown} s)`
              : resendPending
                ? "Envoi…"
                : "Renvoyer un code"}
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          Déjà vérifié ?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
