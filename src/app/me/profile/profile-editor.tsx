"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileFormState } from "@/lib/actions/profile";
import type { OwnProfileDto } from "@/lib/api/mappers/profile";
import { FormField } from "@/components/form-field";
import { TextareaField } from "@/components/textarea-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ProfileFormState = {};

export function ProfileEditor({ profile }: { profile: OwnProfileDto }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <section aria-labelledby="profile-heading" className="flex flex-col gap-4">
      <h2 id="profile-heading" className="text-lg font-semibold">
        Informations
      </h2>

      <Card>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-5">
            {state.error ? (
              <p role="alert" className="text-destructive text-sm">
                {state.error}
              </p>
            ) : null}
            {state.success ? (
              <p role="status" className="text-success text-sm">
                {state.success}
              </p>
            ) : null}

            <FormField
              label="Nom d'utilisateur"
              id="username"
              defaultValue={profile.username}
              readOnly
              disabled
              hint="Non modifiable : ton profil garde la même adresse."
            />

            <FormField
              label="Nom affiché"
              name="displayName"
              autoComplete="name"
              defaultValue={profile.displayName}
              required
              error={state.fieldErrors?.displayName}
            />

            <TextareaField
              label="Bio"
              name="bio"
              rows={3}
              defaultValue={profile.bio ?? ""}
              hint="500 caractères maximum."
              error={state.fieldErrors?.bio}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="École / université"
                name="schoolName"
                defaultValue={profile.schoolName ?? ""}
                error={state.fieldErrors?.schoolName}
              />
              <FormField
                label="Filière"
                name="fieldOfStudy"
                defaultValue={profile.fieldOfStudy ?? ""}
                error={state.fieldErrors?.fieldOfStudy}
              />
            </div>

            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
