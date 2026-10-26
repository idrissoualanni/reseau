"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_TYPES, PROJECT_TYPE_LABELS } from "@/lib/project-types";
import { TextareaField } from "@/components/textarea-field";
import { ProjectSkillsInput } from "@/components/projects/project-skills-input";
import { ProjectCoverUpload } from "@/components/projects/project-cover-upload";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
} from "@/lib/actions/projects";
import {
  MAX_PROJECT_BODY,
  MAX_PROJECT_TITLE,
} from "@/lib/validation/project";
import type { Project, ProjectType, Skill } from "@/lib/types";

type ProjectFormProps = {
  mode: "create" | "edit";
  project?: Project;
  initialSkills?: Skill[];
  coverUrl?: string | null;
};

const initialState: ProjectFormState = {};

type PresignResponse = { uploadUrl: string; key: string; expiresIn: number };

// Éditeur de projet (F05/F06) : création (Enregistrer le brouillon / Publier) ou
// édition (Enregistrer). Couverture F06 : presign PUT avant l'action serveur.
export function ProjectForm({ mode, project, initialSkills = [], coverUrl = null }: ProjectFormProps) {
  const action = mode === "create" ? createProjectAction : updateProjectAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [title, setTitle] = useState(project?.title ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<ProjectType>(project?.type ?? "personal");

  const canPublish = title.trim().length >= 3;

  // Presign PUT de la couverture, puis envoi de l'action serveur. La clé est
  // injectée dans le FormData (vide = suppression en édition).
  async function submitWithCover(formData: FormData) {
    if (coverFile) {
      try {
        const res = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "project-cover",
            contentType: coverFile.type,
            size: coverFile.size,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message ?? "L'upload a échoué.");
        }
        const { uploadUrl, key } = (await res.json()) as PresignResponse;
        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": coverFile.type },
          body: coverFile,
        });
        if (!put.ok) throw new Error("L'upload de l'image a échoué.");
        formData.set("coverKey", key);
      } catch (error) {
        setCoverError(error instanceof Error ? error.message : "L'upload a échoué.");
        return;
      }
    } else if (coverRemoved) {
      formData.set("coverKey", "");
    }
    return formAction(formData);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
        <form action={submitWithCover} className="flex flex-col gap-6">
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

          <div className="space-y-2">
            <Label htmlFor="project-type">Type de projet</Label>
            <input type="hidden" name="type" value={projectType} />
            <Select
              value={[projectType]}
              onValueChange={(value) =>
                setProjectType((value[0] as ProjectType | undefined) ?? "personal")
              }
            >
              <SelectTrigger id="project-type" className="w-full">
                <SelectValue
                  placeholder="Choisir un type"
                  getLabel={(value) => PROJECT_TYPE_LABELS[value as ProjectType]}
                />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {PROJECT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.type ? (
              <p className="text-destructive text-sm">{state.fieldErrors.type}</p>
            ) : null}
          </div>

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

          <ProjectCoverUpload
            initialUrl={coverUrl}
            error={coverError ?? undefined}
            disabled={pending}
            onFileChange={(file) => {
              setCoverError(null);
              setCoverFile(file);
              if (file) setCoverRemoved(false);
            }}
            onRemove={() => {
              setCoverError(null);
              setCoverFile(null);
              setCoverRemoved(true);
            }}
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