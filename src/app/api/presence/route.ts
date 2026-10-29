import { requireSession } from "@/lib/auth";
import { requireOwnProfile } from "@/lib/profile";
import { touchProfilePresence } from "@/lib/repositories/messaging";
import { ok, withApi } from "@/lib/api/respond";
import { guardMutation } from "@/lib/api/security";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Battement de présence : le client l'envoie au montage puis toutes les 45 s.
export const POST = withApi(async (request: Request) => {
  const blocked = guardMutation(request, "/api/presence", APP_URL, 40);
  if (blocked) return blocked;
  const session = await requireSession();
  const profile = await requireOwnProfile(session.user.id);
  await touchProfilePresence(profile.id);
  return ok({ online: true });
});
