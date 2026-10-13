"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { configureAccessMethodAction } from "@/lib/actions/spaces";
import type { SpaceAccessKind } from "@/lib/types";

type AccessMethodFormProps = {
  spaceId: string;
  method: SpaceAccessKind;
  isActive: boolean;
};

// Formulaire d'une méthode d'accès (F17). Le secret éventuel (code/lien) n'est
// affiché qu'immédiatement après génération ; il n'est jamais renvoyé ensuite.
export function AccessMethodForm({ spaceId, method, isActive }: AccessMethodFormProps) {
  const [state, formAction, pending] = useActionState(configureAccessMethodAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="spaceId" value={spaceId} />
      <input type="hidden" name="method" value={method} />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={isActive}
          className="accent-primary size-4"
        />
        Activer cette méthode
      </label>

      {method === "invite_code" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`code-${method}`}>Définir un code (facultatif)</Label>
          <Input
            id={`code-${method}`}
            name="code"
            autoComplete="off"
            placeholder="6 caractères minimum"
            aria-invalid={state.fieldErrors?.code ? true : undefined}
            aria-describedby={state.fieldErrors?.code ? `code-error-${method}` : undefined}
          />
          {state.fieldErrors?.code ? (
            <p id={`code-${method}-error`} role="alert" className="text-destructive text-sm">
              {state.fieldErrors.code}
            </p>
          ) : null}
        </div>
      ) : null}

      {method === "invite_code" || method === "invite_link" ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="regenerate" className="accent-primary size-4" />
          {method === "invite_code" ? "Générer un nouveau code" : "Régénérer le lien"}
        </label>
      ) : null}

      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "…" : "Enregistrer"}
      </Button>

      {state.secret ? (
        <div
          role="status"
          className="border-border bg-surface rounded-md border p-3 text-sm"
        >
          <p className="text-muted-foreground">
            Copie ce secret maintenant : il ne sera plus jamais affiché.
          </p>
          <code className="text-foreground mt-1 block font-mono break-all text-sm">
            {state.secret}
          </code>
        </div>
      ) : null}

      {state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-success text-sm">{state.success}</p> : null}
    </form>
  );
}
