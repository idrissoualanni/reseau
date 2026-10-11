import { listPlatformAdminsUseCase, toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { revokePlatformAdminAction } from "@/lib/actions/admin";
import { getPublicUrl } from "@/lib/storage";
import { Avatar } from "@/components/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ActionButton } from "@/components/admin/action-button";
import { GrantAdminForm } from "@/components/admin/grant-admin-form";
import { formatDate } from "@/components/admin/format";
import type { ProfileRef } from "@/lib/types";

export const instant = false;

// Gestion des administrateurs plateforme (F16).
export default async function AdminAdminsPage() {
  const session = await requireSession();
  const admins = await listPlatformAdminsUseCase(toAdminContext(session));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <GrantAdminForm />
        </CardContent>
      </Card>

      {admins.length === 0 ? (
        <EmptyState
          title="Aucun administrateur"
          description="Nomme un administrateur par son nom d'utilisateur."
        />
      ) : (
        <ul className="divide-border divide-y rounded-lg border">
          {admins.map((admin) => (
            <li key={admin.profileId} className="flex flex-wrap items-center gap-4 p-4">
              <AdminIdentity profile={admin.profile} />
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-sm">
                  Nommé le {formatDate(admin.grantedAt)}
                  {admin.grantedBy ? ` par ${admin.grantedBy.displayName}` : ""}
                </p>
              </div>
              <ActionButton
                action={revokePlatformAdminAction}
                fields={{ profileId: admin.profileId }}
                label="Retirer"
                pendingLabel="Retrait…"
                variant="outline"
                confirm={`Retirer les droits d'administration à ${admin.profile.displayName} ?`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminIdentity({ profile }: { profile: ProfileRef }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar
        name={profile.displayName}
        src={profile.avatarKey ? getPublicUrl(profile.avatarKey) : null}
      />
      <div>
        <p className="text-foreground font-medium">{profile.displayName}</p>
        <p className="text-muted-foreground text-sm">@{profile.username}</p>
      </div>
    </div>
  );
}
