import { toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { toMembershipDto } from "@/lib/api/mappers/space";
import { noContent, ok, parseInput, readJson, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";
import {
  decideMembership,
  revokeMembership,
  setMembershipRole,
} from "@/lib/spaces";
import {
  membershipDecisionSchema,
  setMembershipRoleSchema,
} from "@/lib/validation/space";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const ROUTE = "/api/admin/spaces/[id]/members/[membershipId]";

type RouteContext = { params: Promise<{ id: string; membershipId: string }> };

// Change le rôle d'un membre (member ↔ space_admin).
export const PATCH = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, ROUTE, APP_URL, 30);
  if (blocked) return blocked;

  const session = await requireSession();
  const { id, membershipId } = await context.params;
  const input = parseInput(setMembershipRoleSchema, await readJson(request));
  const membership = await setMembershipRole(
    toAdminContext(session),
    id,
    membershipId,
    input,
  );
  return ok(toMembershipDto(membership));
});

// Approuve ou refuse une demande en attente : `{ action: "approve" | "reject" }`.
export const POST = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, ROUTE, APP_URL, 30);
  if (blocked) return blocked;

  const session = await requireSession();
  const { id, membershipId } = await context.params;
  const { action } = parseInput(membershipDecisionSchema, await readJson(request));
  const membership = await decideMembership(
    toAdminContext(session),
    id,
    membershipId,
    action,
  );

  // Le refus supprime l'appartenance : rien à renvoyer.
  if (!membership) return noContent();
  return ok(toMembershipDto(membership));
});

// Retire un membre de l'espace (action journalisée `revoke`).
export const DELETE = withApi(async (request: Request, context: RouteContext) => {
  const blocked = guardMutation(request, ROUTE, APP_URL, 30);
  if (blocked) return blocked;

  const session = await requireSession();
  const { id, membershipId } = await context.params;
  await revokeMembership(toAdminContext(session), id, membershipId);
  return noContent();
});
