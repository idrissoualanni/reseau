import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = React.ComponentProps<"input"> & {
  label: string;
  error?: string;
  hint?: string;
};

// Champ de formulaire accessible : label lié, erreur annoncée aux lecteurs
// d'écran, aide contextuelle. Brique maison pour les écrans d'auth.
export function FormField({ label, error, hint, id, name, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? name;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...inputProps}
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
