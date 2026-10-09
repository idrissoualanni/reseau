import { builder } from "@/server/graphql/builder";
import type { ProfileSummary } from "@/server/graphql/loaders";
import { getPublicUrl } from "@/lib/storage";

// Résumé public d'un membre : jamais d'email ni d'identifiant Neon Auth.
export const ProfileSummaryRef = builder
  .objectRef<ProfileSummary>("ProfileSummary")
  .implement({
    description: "Résumé public d'un membre.",
    fields: (t) => ({
      id: t.exposeID("id"),
      username: t.exposeString("username"),
      displayName: t.exposeString("displayName"),
      avatarUrl: t.string({
        nullable: true,
        resolve: (profile) =>
          profile.avatarKey ? getPublicUrl(profile.avatarKey) : null,
      }),
    }),
  });
