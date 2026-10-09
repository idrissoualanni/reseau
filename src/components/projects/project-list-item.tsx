"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SkillBadge } from "@/components/skill-badge";
import {
  deleteProjectAction,
  publishProjectAction,
  unpublishProjectAction,
  type ProjectFormState,
} from "@/lib/actions/projects";
import type { Project, Skill } from "@/lib/types";

type ProjectListItemProps = {
  project: Project;
  skills: Skill[];
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

// Carte d'un projet dans la liste `/me/projects` (F05) : statut, compétences,
// édition et actions Publier/Dépublier/Supprimer (suppression en deux temps).
export function ProjectListItem({ project, skills }: ProjectListItemProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const published = project.status === "published";

  function run(action: (formData: FormData) => Promise<ProjectFormState>) {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", project.id);
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/me/projects/${project.id}/edit`}
              className="text-foreground hover:text-primary text-base font-semibold tracking-tight underline-offset-4 hover:underline"
            >
              {project.title}
            </Link>
            <p className="text-muted-foreground text-xs">
              Modifié le {formatDate(project.updatedAt)}
            </p>
          </div>
          {published ? (
            <Badge variant="success">Publié</Badge>
          ) : (
            <Badge variant="outline">Brouillon</Badge>
          )}
        </div>

        {skills.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <li key={skill.id}>
                <SkillBadge skill={skill} />
              </li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/me/projects/${project.id}/edit`}>
              <Pencil aria-hidden />
              Modifier
            </Link>
          </Button>
          {published ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => run(unpublishProjectAction)}
              disabled={pending}
            >
              {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
              Dépublier
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => run(publishProjectAction)}
              disabled={pending}
            >
              {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
              Publier
            </Button>
          )}
          {confirming ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => run(deleteProjectAction)}
                disabled={pending}
              >
                {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
                Confirmer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={pending}
              >
                Annuler
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(true)}
              disabled={pending}
              aria-label={`Supprimer le projet ${project.title}`}
            >
              Supprimer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}