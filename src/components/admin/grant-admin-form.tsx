"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { grantPlatformAdminAction, type AdminFormState } from "@/lib/actions/admin";

const initialState: AdminFormState = {};

// Nomination d'un administrateur plateforme par nom d'utilisateur (F16).
export function GrantAdminForm() {
  const [state, formAction, pending] = useActionState(grantPlatformAdminAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <FormField
          label="Nom d'utilisateur à nommer"
          name="username"
          placeholder="ex. alice"
          autoComplete="off"
          error={state.fieldErrors?.username}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Nomination…" : "Nommer admin"}
      </Button>
      {state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-success text-sm">{state.success}</p> : null}
    </form>
  );
}
