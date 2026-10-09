import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TextareaFieldProps = React.ComponentProps<"textarea"> & {
  label: string;
  error?: string;
  hint?: string;
};

// Champ multiligne accessible : label lié, erreur annoncée, aide contextuelle.
// Complète `FormField` (une seule ligne) pour les bios et textes de projet.
export function TextareaField({ label, error, hint, id, name, ...props }: TextareaFieldProps) {
  const fieldId = id ?? name;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <Textarea
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}
