"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectReactions } from "./project-reactions";
import { ProjectComments } from "./project-comments";
import { ProjectFollowers } from "./project-followers";
import { ProjectActivity } from "./project-activity";

type ProjectTabsProps = {
  projectId: string;
  isAuthor: boolean;
};

export function ProjectTabs({ projectId, isAuthor }: ProjectTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Aperçu</TabsTrigger>
        <TabsTrigger value="activity">Activité</TabsTrigger>
        <TabsTrigger value="discussion">Discussion</TabsTrigger>
        <TabsTrigger value="followers">Suiveurs</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Contenu de l'aperçu du projet (existant)
        </p>
      </TabsContent>

      <TabsContent value="activity" className="space-y-4">
        <ProjectActivity projectId={projectId} isAuthor={isAuthor} />
      </TabsContent>

      <TabsContent value="discussion" className="space-y-4">
        <ProjectComments projectId={projectId} />
      </TabsContent>

      <TabsContent value="followers" className="space-y-4">
        <ProjectFollowers projectId={projectId} />
      </TabsContent>
    </Tabs>
  );
}