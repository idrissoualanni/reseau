import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageGallery } from "@/components/ui/image-gallery";
import { Avatar } from "@/components/avatar";
import { SkillBadge } from "@/components/skill-badge";
import type { FeedProject } from "@/lib/feed";
import type { AuthorSummary } from "@/lib/api/mappers/profile";
import type { Skill } from "@/lib/types";

type ProjectCardProps = {
  project: FeedProject;
  skills: Skill[];
  author: AuthorSummary | null;
};

const MAX_SKILLS_SHOWN = 3;

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

// Carte d'un projet publié, réutilisée par le fil (F07) et le profil (F08) :
// couverture ou visuel par défaut, extrait, auteur lien, compétences (max 3).
// Composant statique : aucune interaction locale (les actions vivent ailleurs).
export function ProjectCard({ project, skills, author }: ProjectCardProps) {
  return (
    <Card className="overflow-hidden">
      {project.imageUrls.length > 0 ? (
        <ImageGallery
          images={project.imageUrls}
          href={`/projects/${project.id}`}
          alt={`Aperçu de ${project.title}`}
          imageClassName="aspect-[2/1] max-h-none"
        />
      ) : (
        <div
          aria-hidden
          className="bg-muted flex aspect-[2/1] w-full items-center justify-center"
        >
          <ImageIcon className="text-muted-foreground/40 size-8" />
        </div>
      )}
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <Link
            href={`/projects/${project.id}`}
            className="hover:underline focus-visible:ring-ring inline-block rounded-sm text-base font-semibold outline-none focus-visible:ring-2"
          >
            {project.title}
          </Link>
          <p className="text-muted-foreground text-sm">{project.excerpt}</p>
        </div>

        <div className="flex items-center gap-2">
          {author ? (
            <Link
              href={`/u/${author.username}`}
              className="hover:underline focus-visible:ring-ring inline-flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2"
            >
              <Avatar name={author.displayName} src={author.avatarUrl} size="md" className="size-6 text-xs" />
              <span className="text-muted-foreground text-sm">{author.displayName}</span>
            </Link>
          ) : (
            <span className="text-muted-foreground text-sm">Membre</span>
          )}
          {project.publishedAt ? (
            <time
              dateTime={project.publishedAt}
              className="text-muted-foreground/70 ml-auto text-xs"
            >
              {formatDate(project.publishedAt)}
            </time>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {skills.slice(0, MAX_SKILLS_SHOWN).map((skill) => (
            <SkillBadge key={skill.id} skill={skill} />
          ))}
          {skills.length > MAX_SKILLS_SHOWN ? (
            <span className="text-muted-foreground text-xs">+{skills.length - MAX_SKILLS_SHOWN}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}