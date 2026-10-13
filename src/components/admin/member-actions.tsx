"use client";

import { useActionState } from "react";
import {
  decideMembershipAction,
  revokeMembershipAction,
  setMembershipRoleAction,
} from "@/lib/actions/spaces";

// Actions de gestion d'un membre (F17). Chaque formulaire appelle une action
// serveur qui revérifie l'autorisation de l'espace.

export function PendingMemberActions({
  spaceId,
  membershipId,
}: {
  spaceId: string;
  membershipId: string;
}) {
  const [state, formAction, pending] = useActionState(decideMembershipAction, {});

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="spaceId" value={spaceId} />
      <input type="hidden" name="membershipId" value={membershipId} />
      <div className="flex gap-2">
        <button
          type="submit"
          name="action"
          value="approve"
          disabled={pending}
          className="bg-primary text-primary-foreground focus-visible:ring-ring/50 inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
        >
          Approuver
        </button>
        <button
          type="submit"
          name="action"
          value="reject"
          disabled={pending}
          className="border-input bg-background hover:bg-accent/10 inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Refuser
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-destructive text-xs">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-success text-xs">{state.success}</p> : null}
    </form>
  );
}

export function MemberRowActions({
  spaceId,
  membershipId,
  role,
}: {
  spaceId: string;
  membershipId: string;
  role: "member" | "space_admin";
}) {
  const [roleState, roleAction, rolePending] = useActionState(setMembershipRoleAction, {});
  const [revokeState, revokeAction, revokePending] = useActionState(revokeMembershipAction, {});

  const nextRole = role === "space_admin" ? "member" : "space_admin";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <form action={roleAction}>
          <input type="hidden" name="spaceId" value={spaceId} />
          <input type="hidden" name="membershipId" value={membershipId} />
          <input type="hidden" name="role" value={nextRole} />
          <button
            type="submit"
            disabled={rolePending}
            className="border-input bg-background hover:bg-accent/10 inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {role === "space_admin" ? "Rétrograder" : "Nommer gestionnaire"}
          </button>
        </form>
        <form
          action={revokeAction}
          onSubmit={(event) => {
            if (!window.confirm("Retirer ce membre de l'espace ?")) event.preventDefault();
          }}
        >
          <input type="hidden" name="spaceId" value={spaceId} />
          <input type="hidden" name="membershipId" value={membershipId} />
          <button
            type="submit"
            disabled={revokePending}
            className="text-destructive border-destructive/40 hover:bg-destructive/10 inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Retirer
          </button>
        </form>
      </div>
      {roleState.error ?? revokeState.error ? (
        <p role="alert" className="text-destructive text-xs">
          {roleState.error ?? revokeState.error}
        </p>
      ) : null}
      {roleState.success ?? revokeState.success ? (
        <p className="text-success text-xs">{roleState.success ?? revokeState.success}</p>
      ) : null}
    </div>
  );
}
