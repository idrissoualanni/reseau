import Link from "next/link";
import { listProjectsForAdmin, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/components/admin/format";

export const instant = false;

// Tous les projets (F17), brouillons compris : lecture seule.
export default async function AdminProjectsPage() {
  const session = await requireSession();
  const projects = await listProjectsForAdmin(toAdminContext(session));

  if (projects.length === 0) {
    return <EmptyState title="Aucun projet" description="Aucun projet n'a encore été créé." />;
  }

  return (
    <ul className="divide-border divide-y rounded-lg border">
      {projects.map(({ project, author }) => (
        <li key={project.id} className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-foreground font-medium">{project.title}</span>
              <Badge variant={project.status === "published" ? "success" : "secondary"}>
                {project.status === "published" ? "Publié" : "Brouillon"}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              <Link href={`/u/${author.username}`} className="hover:underline">
                {author.displayName}
              </Link>{" "}
              · @{author.username}
            </p>
          </div>
          <p className="text-muted-foreground text-sm tabular-nums">
            {formatDateTime(project.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
