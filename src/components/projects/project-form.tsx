"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { TextareaField } from "@/components/textarea-field";
import { ProjectSkillsInput } from "@/components/projects/project-skills-input";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
} from "@/lib/actions/projects";
import { MAX_PROJECT_BODY, MAX_PROJECT_TITLE } from "@/lib/validation/project";
import type { Project, Skill } from "@/lib/types";

type ProjectFormProps = {
  mode: "create" | "edit";
  project?: Project;
  initialSkills?: Skill[];
};

const initialState: ProjectFormState = {};

// Éditeur de projet (F05/F06) : création (Enregistrer le brouillon / Publier) ou
// édition (Enregistrer). Couverture différée (F06 image, ADR 0004).
export function ProjectForm({ mode, project, initialSkills = [] }: ProjectFormProps) {
  const action = mode === "create" ? createProjectAction : updateProjectAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [title, setTitle] = useState(project?.title ?? "");

  const canPublish = title.trim().length >= 3;

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
        <form action={formAction} className="flex flex-col gap-6">
          {mode === "edit" && project ? (
            <input type="hidden" name="id" value={project.id} />
          ) : null}

          {state.error ? (
            <p
              role="alert"
              aria-live="polite"
              className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
            >
              {state.error}
            </p>
          ) : null}

          <FormField
            name="title"
            label="Titre du projet"
            placeholder="Ex. Application mobile de covoiturage"
            maxLength={MAX_PROJECT_TITLE}
            defaultValue={project?.title}
            onChange={(event) => setTitle(event.target.value)}
            error={state.fieldErrors?.title}
            hint={`${MAX_PROJECT_TITLE} caractères maximum.`}
            required
          />

          <TextareaField
            name="body"
            label="Texte du projet"
            placeholder="Décris ce que tu as réalisé, ton rôle, le résultat…"
            maxLength={MAX_PROJECT_BODY}
            defaultValue={project?.body}
            error={state.fieldErrors?.body}
            hint={`${MAX_PROJECT_BODY} caractères maximum.`}
            rows={8}
          />

          <ProjectSkillsInput
            initialSkills={initialSkills}
            error={state.fieldErrors?.skillSlugs}
          />

          <div className="flex flex-wrap items-center gap-3">
            {mode === "create" ? (
              <>
                <Button
                  type="submit"
                  name="submit"
                  value="save"
                  variant="outline"
                  disabled={pending}
                >
                  {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
                  Enregistrer le brouillon
                </Button>
                <Button type="submit" name="submit" value="publish" disabled={pending || !canPublish}>
                  {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
                  Publier
                </Button>
              </>
            ) : (
              <>
                <Button type="submit" name="submit" value="save" disabled={pending}>
                  {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
                  Enregistrer
                </Button>
                <Button asChild variant="outline">
                  <Link href="/me/projects">Retour</Link>
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}