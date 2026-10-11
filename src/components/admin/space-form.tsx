"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { TextareaField } from "@/components/textarea-field";
import { Label } from "@/components/ui/label";
import {
  createSpaceAction,
  updateSpaceAction,
  type AdminFormState,
} from "@/lib/actions/admin";
import { SPACE_TYPES, SPACE_VISIBILITIES } from "@/lib/validation/space";

type SpaceFormProps = {
  mode: "create" | "edit";
  space?: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    type: string;
    visibility: string;
  };
};

const initialState: AdminFormState = {};

const TYPE_LABELS: Record<string, string> = {
  university: "Université",
  department: "Filière",
  theme: "Thème",
};

const VISIBILITY_LABELS: Record<string, string> = {
  public: "Public",
  private: "Privé",
};

// Formulaire d'espace (F14) : création ou édition. En édition le slug reste figé
// (il sert d'identifiant public stable).
export function SpaceForm({ mode, space }: SpaceFormProps) {
  const action = mode === "create" ? createSpaceAction : updateSpaceAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [description, setDescription] = useState(space?.description ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {mode === "edit" && space ? <input type="hidden" name="id" value={space.id} /> : null}

      {mode === "create" ? (
        <FormField
          label="Slug"
          name="slug"
          placeholder="ex. universite-lomé"
          autoComplete="off"
          hint="Minuscules, chiffres ou tiret. Identifiant public de l'espace."
          error={state.fieldErrors?.slug}
        />
      ) : space ? (
        <p className="text-muted-foreground text-sm">
          Slug : <span className="text-foreground font-mono">{space.slug}</span>
        </p>
      ) : null}

      <FormField
        label="Nom"
        name="name"
        defaultValue={space?.name}
        autoComplete="off"
        error={state.fieldErrors?.name}
      />

      <TextareaField
        label="Description"
        name="description"
        rows={4}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        error={state.fieldErrors?.description}
      />

      <NativeSelect
        label="Type"
        name="type"
        defaultValue={space?.type ?? "university"}
        options={SPACE_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] ?? value }))}
        error={state.fieldErrors?.type}
      />

      <NativeSelect
        label="Visibilité"
        name="visibility"
        defaultValue={space?.visibility ?? "public"}
        options={SPACE_VISIBILITIES.map((value) => ({
          value,
          label: VISIBILITY_LABELS[value] ?? value,
        }))}
        error={state.fieldErrors?.visibility}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {state.error ? (
          <p role="alert" className="text-destructive text-sm">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}

type NativeSelectProps = {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  error?: string;
};

// Sélecteur natif accessible, aligné sur le style des champs du design system.
function NativeSelect({ label, name, defaultValue, options, error }: NativeSelectProps) {
  const fieldId = `${name}-select`;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <select
        id={fieldId}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] aria-invalid:border-destructive"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
