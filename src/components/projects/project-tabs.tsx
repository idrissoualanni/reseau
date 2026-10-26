"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectReactions } from "./project-reactions";
import { ProjectComments } from "./project-comments";
import { ProjectFollowers } from "./project-followers";
import { ProjectActivity } from "./project-activity";
import { ProjectShareButton } from "./project-share-button";
import type { ProjectSocialData } from "@/lib/project-social";

type ProjectTabsProps = {
  projectId: string;
  viewerId: string;
  isAuthor: boolean;
  projectTitle: string;
  social: ProjectSocialData;
  overview: ReactNode;
};

export function ProjectTabs({
  projectId,
  viewerId,
  isAuthor,
  projectTitle,
  social,
  overview,
}: ProjectTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Aperçu</TabsTrigger>
        <TabsTrigger value="activity">Activité</TabsTrigger>
        <TabsTrigger value="discussion">Discussion</TabsTrigger>
        <TabsTrigger value="followers">Suiveurs</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        {overview}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <ProjectReactions
            projectId={projectId}
            initialReactions={social.reactions}
          />
          <ProjectShareButton projectTitle={projectTitle} />
        </div>
      </TabsContent>

      <TabsContent value="activity" className="space-y-4">
        <ProjectActivity
          projectId={projectId}
          viewerId={viewerId}
          isAuthor={isAuthor}
          initialUpdates={social.updates}
          initialHasNextPage={social.updatesHasNextPage}
          initialEndCursor={social.updatesEndCursor}
        />
      </TabsContent>

      <TabsContent value="discussion" className="space-y-4">
        <ProjectComments
          projectId={projectId}
          viewerId={viewerId}
          initialComments={social.comments}
        />
      </TabsContent>

      <TabsContent value="followers" className="space-y-4">
        <ProjectFollowers
          projectId={projectId}
          isAuthor={isAuthor}
          initialFollowerCount={social.followerCount}
          initialIsFollowed={social.isFollowed}
          initialFollowers={social.followers}
          initialHasNextPage={social.followersHasNextPage}
          initialEndCursor={social.followersEndCursor}
        />
      </TabsContent>
    </Tabs>
  );
}
