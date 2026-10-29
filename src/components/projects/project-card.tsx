import Link from "next/link";
import { Heart, ImageIcon, MessageCircle, Users, type LucideIcon } from "lucide-react";
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

function Count({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1" title={`${value} ${label}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="tabular-nums">{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

// Carte d'un projet publié (F07/F08) : visuel plein cadre, texte en
// surimpression, puis auteurs, compteurs et compétences. Statique : aucune
// interaction locale (les actions vivent sur la page projet).
export function ProjectCard({ project, skills, author }: ProjectCardProps) {
  const hasImage = project.imageUrls.length > 0;

  return (
    <Card className="overflow-hidden">
      {hasImage ? (
        <div className="relative">
          <ImageGallery
            images={project.imageUrls}
            href={`/projects/${project.id}`}
            alt={`Aperçu de ${project.title}`}
            className="rounded-none"
            imageClassName="aspect-[16/9] max-h-none"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
            <p className="text-lg leading-tight font-semibold text-white">
              {project.title}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-white/85">
              {project.excerpt}
            </p>
          </div>
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="bg-muted flex aspect-[16/9] w-full items-center justify-center"
        >
          <ImageIcon className="text-muted-foreground/40 size-8" />
        </div>
      )}

      <CardContent className="space-y-3 p-4">
        {!hasImage ? (
          <div className="space-y-1">
            <Link
              href={`/projects/${project.id}`}
              className="hover:underline focus-visible:ring-ring inline-block rounded-sm text-base font-semibold outline-none focus-visible:ring-2"
            >
              {project.title}
            </Link>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {project.excerpt}
            </p>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          {author ? (
            <Link
              href={`/u/${author.username}`}
              className="hover:underline focus-visible:ring-ring inline-flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2"
            >
              <Avatar
                name={author.displayName}
                src={author.avatarUrl}
                size="md"
                className="size-6 text-xs"
              />
              <span className="text-muted-foreground text-sm">
                {author.displayName}
              </span>
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

        <div className="text-muted-foreground border-border/60 flex items-center gap-4 border-t pt-3 text-xs">
          <Count icon={Heart} value={project.reactionCount} label="réactions" />
          <Count
            icon={MessageCircle}
            value={project.commentCount}
            label="commentaires"
          />
          <Count icon={Users} value={project.followerCount} label="abonnés" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {skills.slice(0, MAX_SKILLS_SHOWN).map((skill) => (
            <SkillBadge key={skill.id} skill={skill} />
          ))}
          {skills.length > MAX_SKILLS_SHOWN ? (
            <span className="text-muted-foreground text-xs">
              +{skills.length - MAX_SKILLS_SHOWN}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
