"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { resendVerificationAction, verifyEmailAction, type FormState } from "@/lib/actions/auth";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

const initialState: FormState = {};

export function VerifyEmailForm() {
  const email = useSearchParams().get("email") ?? "";
  const [state, formAction, pending] = useActionState(verifyEmailAction, initialState);
  const [resendState, resendAction, resendPending] = useActionState(
    resendVerificationAction,
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-semibold tracking-tight">Vérifie ton e-mail</h1>
        <CardDescription>
          Un code à 6 chiffres a été envoyé à {email || "ton adresse e-mail"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={formAction} className="flex flex-col gap-4">
          {state.error ? (
            <p role="alert" className="text-destructive text-sm">
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
            {pending ? "Vérification…" : "Vérifier"}
          </Button>
        </form>
        <form action={resendAction} className="flex flex-col gap-2">
          <input type="hidden" name="email" defaultValue={email} />
          {resendState.success ? (
            <p role="status" className="text-muted-foreground text-center text-sm">
              {resendState.success}
            </p>
          ) : null}
          <Button type="submit" variant="link" disabled={resendPending}>
            Renvoyer le code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
