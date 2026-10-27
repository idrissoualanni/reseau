import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { listMyConversations } from "@/lib/messaging";
import { toConversationSummaryDto } from "@/lib/api/mappers/messaging";
import { MessagesShell } from "@/components/messages/messages-shell";

export const instant = false;

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding/profile");

  const conversations = await listMyConversations({
    userId: session.user.id,
    profileId: profile.id,
  });
  const { c } = await searchParams;

  return (
    <MessagesShell
      currentProfileId={profile.id}
      initialConversations={conversations.map(toConversationSummaryDto)}
      initialConversationId={c ?? null}
    />
  );
}
