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
import { GalleryUploader } from "@/components/ui/gallery-uploader";
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
  coverKeys?: string[];
  coverUrls?: string[];
};

const initialState: ProjectFormState = {};

// Éditeur de projet (F05/F06 (galerie V1.5)) : création (Enregistrer le brouillon /
// Publier) ou édition (Enregistrer). Galerie de 5 images maximum, la première
// servant de couverture ; l'upload présigné se fait au choix des fichiers.
export function ProjectForm({
  mode,
  project,
  initialSkills = [],
  coverKeys = [],
  coverUrls = [],
}: ProjectFormProps) {
  const action = mode === "create" ? createProjectAction : updateProjectAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [title, setTitle] = useState(project?.title ?? "");
  const [uploading, setUploading] = useState(false);
  const [projectType, setProjectType] = useState<ProjectType>(project?.type ?? "personal");

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

          <GalleryUploader
            kind="project-cover"
            coverField="coverKey"
            initialKeys={coverKeys}
            initialUrls={coverUrls}
            onUploadingChange={setUploading}
          />

          <div className="flex flex-wrap items-center gap-3">
            {mode === "create" ? (
              <>
                <Button
                  type="submit"
                  name="submit"
                  value="save"
                  variant="outline"
                  disabled={pending || uploading}
                >
                  {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
                  Enregistrer le brouillon
                </Button>
                <Button type="submit" name="submit" value="publish" disabled={pending || uploading || !canPublish}>
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