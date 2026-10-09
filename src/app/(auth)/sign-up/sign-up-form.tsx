"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type FormState } from "@/lib/actions/auth";
import { FormField } from "@/components/form-field";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

const initialState: FormState = {};

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-semibold tracking-tight">Créer ton compte</h1>
        <CardDescription>Quelques secondes et c&apos;est parti.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error ? (
            <p role="alert" aria-live="polite" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}
          <FormField
            label="Nom"
            name="name"
            autoComplete="name"
            required
            error={state.fieldErrors?.name}
          />
          <FormField
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={state.fieldErrors?.email}
          />
          <PasswordField
            label="Mot de passe"
            name="password"
            autoComplete="new-password"
            required
            hint="8 caractères minimum."
            error={state.fieldErrors?.password}
          />
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Création…" : "Créer mon compte"}
          </Button>
        </form>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          Déjà un compte ?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
