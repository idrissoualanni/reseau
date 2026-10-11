import Link from "next/link";
import { listProfilesForAdmin, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { getPublicUrl } from "@/lib/storage";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/components/admin/format";

export const instant = false;

// Tous les profils (F17) : lecture seule. `userId` n'est jamais exposé.
export default async function AdminProfilesPage() {
  const session = await requireSession();
  const profiles = await listProfilesForAdmin(toAdminContext(session));

  if (profiles.length === 0) {
    return <EmptyState title="Aucun profil" description="Aucun compte n'est encore inscrit." />;
  }

  return (
    <ul className="divide-border divide-y rounded-lg border">
      {profiles.map(({ profile, postCount, projectCount }) => (
        <li key={profile.id} className="flex flex-wrap items-center gap-4 p-4">
          <Avatar
            name={profile.displayName}
            src={profile.avatarKey ? getPublicUrl(profile.avatarKey) : null}
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/u/${profile.username}`}
              className="text-foreground font-medium hover:underline"
            >
              {profile.displayName}
            </Link>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
          </div>
          <p className="text-muted-foreground text-sm tabular-nums">
            {postCount} post{postCount > 1 ? "s" : ""} · {projectCount} projet
            {projectCount > 1 ? "s" : ""}
          </p>
          <p className="text-muted-foreground text-sm tabular-nums">
            inscrit le {formatDate(profile.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
