import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { getPublicUrl } from "@/lib/storage";
import type { SpaceMember } from "@/lib/types";

// Liste publique des membres d'un espace (F15) : identité publique uniquement
// (pseudo, nom affiché, avatar). Aucune donnée de gestion n'y figure.
export function SpaceMemberList({ members }: { members: SpaceMember[] }) {
  return (
    <ul className="divide-border divide-y rounded-lg border">
      {members.map(({ profile }) => (
        <li key={profile.id} className="flex items-center gap-3 px-3 py-2">
          <Avatar
            name={profile.displayName}
            src={profile.avatarKey ? getPublicUrl(profile.avatarKey) : null}
          />
          <div className="min-w-0">
            <Link
              href={`/u/${profile.username}`}
              className="text-foreground block truncate text-sm font-medium hover:underline"
            >
              {profile.displayName}
            </Link>
            <p className="text-muted-foreground truncate text-xs">@{profile.username}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
