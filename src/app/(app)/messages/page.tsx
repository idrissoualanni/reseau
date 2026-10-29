import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { listMyContactRequests, listMyConversations } from "@/lib/messaging";
import {
  toContactRequestDto,
  toConversationSummaryDto,
} from "@/lib/api/mappers/messaging";
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

  const context = { userId: session.user.id, profileId: profile.id };
  const [conversations, requests] = await Promise.all([
    listMyConversations(context),
    listMyContactRequests(context),
  ]);
  const requestItems = requests.map((row) => toContactRequestDto(row, profile.id));
  const { c } = await searchParams;

  return (
    <MessagesShell
      currentProfileId={profile.id}
      initialConversations={conversations.map(toConversationSummaryDto)}
      initialConversationId={c ?? null}
      initialRequests={{
        incoming: requestItems.filter((item) => item.direction === "incoming"),
        outgoing: requestItems.filter((item) => item.direction === "outgoing"),
      }}
    />
  );
}
