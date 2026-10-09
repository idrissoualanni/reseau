"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, resetPasswordAction, type FormState } from "@/lib/actions/auth";
import { FormField } from "@/components/form-field";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

const initialState: FormState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);
  const [resetState, resetFormAction, resetPending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  const email = resetState.email ?? state.email ?? "";

  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-semibold tracking-tight">Mot de passe oublié</h1>
        <CardDescription>Reçois un code puis choisis un nouveau mot de passe.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!email ? (
          <form action={formAction} className="flex flex-col gap-4">
            {state.error ? (
              <p role="alert" className="text-destructive text-sm">
                {state.error}
              </p>
            ) : null}
            <FormField
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              required
              error={state.fieldErrors?.email}
            />
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Envoi…" : "Envoyer le code"}
            </Button>
          </form>
        ) : (
          <form action={resetFormAction} className="flex flex-col gap-4">
            {state.success ? (
              <p role="status" className="text-muted-foreground text-sm">
                {state.success}
              </p>
            ) : null}
            {resetState.error ? (
              <p role="alert" className="text-destructive text-sm">
                {resetState.error}
              </p>
            ) : null}
            <input type="hidden" name="email" defaultValue={email} />
            <FormField
              label="Code reçu"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              error={resetState.fieldErrors?.otp}
            />
            <PasswordField
              label="Nouveau mot de passe"
              name="password"
              autoComplete="new-password"
              required
              hint="8 caractères minimum."
              error={resetState.fieldErrors?.password}
            />
            <Button type="submit" disabled={resetPending} className="w-full">
              {resetPending ? "Enregistrement…" : "Changer le mot de passe"}
            </Button>
          </form>
        )}
        <p className="text-center text-sm">
          <Link href="/sign-in" className="text-primary hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
