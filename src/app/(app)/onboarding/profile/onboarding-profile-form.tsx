"use client";

import { useActionState } from "react";
import { createProfileAction, type ProfileFormState } from "@/lib/actions/profile";
import { FormField } from "@/components/form-field";
import { TextareaField } from "@/components/textarea-field";
import { UsernameField } from "@/components/username-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ProfileFormState = {};

export function OnboardingProfileForm() {
  const [state, formAction, pending] = useActionState(createProfileAction, initialState);

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5">
          {state.error ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}

          <UsernameField error={state.fieldErrors?.username} />

          <FormField
            label="Nom affiché"
            name="displayName"
            autoComplete="name"
            required
            hint="Tel qu'il apparaîtra sur ton profil."
            error={state.fieldErrors?.displayName}
          />

          <TextareaField
            label="Bio"
            name="bio"
            rows={3}
            hint="500 caractères maximum."
            error={state.fieldErrors?.bio}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="École / université"
              name="schoolName"
              error={state.fieldErrors?.schoolName}
            />
            <FormField label="Filière" name="fieldOfStudy" error={state.fieldErrors?.fieldOfStudy} />
          </div>

          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Création…" : "Créer mon profil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
