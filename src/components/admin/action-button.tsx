"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminFormState } from "@/lib/actions/admin";

type ActionButtonProps = {
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  fields: Record<string, string>;
  label: string;
  pendingLabel?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  confirm?: string;
};

// Bouton d'action admin : champs cachés + état (erreur/succès) annoncé.
export function ActionButton({
  action,
  fields,
  label,
  pendingLabel = "…",
  variant = "outline",
  confirm,
}: ActionButtonProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      className="inline-flex flex-col items-end gap-1"
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending ? pendingLabel : label}
      </Button>
      {state.error ? (
        <p role="alert" className="text-destructive text-xs">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-success text-xs">{state.success}</p> : null}
    </form>
  );
}
