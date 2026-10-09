"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signInAction, type FormState } from "@/lib/actions/auth";
import { safeNextPath } from "@/lib/safe-next";
import { FormField } from "@/components/form-field";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

const initialState: FormState = {};

export function SignInForm() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const reset = searchParams.get("reset") === "1";
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-semibold tracking-tight">Se connecter</h1>
        <CardDescription>Retrouve tes projets et ton profil.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {reset ? (
            <p role="status" className="text-muted-foreground text-sm">
              Mot de passe mis à jour. Connecte-toi.
            </p>
          ) : null}
          {state.error ? (
            <p role="alert" aria-live="polite" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}
          <input type="hidden" name="next" defaultValue={next} />
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
            autoComplete="current-password"
            required
            error={state.fieldErrors?.password}
          />
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
          <Link href="/sign-up" className="text-primary hover:underline">
            S&apos;inscrire
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
