"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Lightbulb, Loader2, PartyPopper, ThumbsUp } from "lucide-react";
import { toggleProjectReactionAction } from "@/lib/actions/project-social";
import type { ProjectReactionView } from "@/lib/project-social";
import type { ProjectReactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

const REACTION_CONFIG: Record<
  ProjectReactionType,
  { icon: React.ElementType; label: string; color: string }
> = {
  like: { icon: ThumbsUp, label: "J'aime", color: "text-primary" },
  celebrate: { icon: PartyPopper, label: "Célébrer", color: "text-accent" },
  insight: { icon: Lightbulb, label: "Instructif", color: "text-success" },
  curious: { icon: HelpCircle, label: "Curieux", color: "text-muted-foreground" },
};

const REACTION_TYPES: ProjectReactionType[] = [
  "like",
  "celebrate",
  "insight",
  "curious",
];

type ProjectReactionsProps = {
  projectId: string;
  initialReactions: ProjectReactionView[];
};

export function ProjectReactions({
  projectId,
  initialReactions,
}: ProjectReactionsProps) {
  const [reactions, setReactions] = useState(initialReactions);
  const [pendingType, setPendingType] = useState<ProjectReactionType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getReaction = (type: ProjectReactionType): ProjectReactionView =>
    reactions.find((reaction) => reaction.type === type) ?? {
      type,
      count: 0,
      hasReacted: false,
    };

  async function handleToggle(type: ProjectReactionType) {
    if (pendingType) return;
    const previous = reactions;
    const current = getReaction(type);
    const next = {
      type,
      count: Math.max(0, current.count + (current.hasReacted ? -1 : 1)),
      hasReacted: !current.hasReacted,
    };

    setError(null);
    setPendingType(type);
    setReactions((items) =>
      items.map((reaction) => (reaction.type === type ? next : reaction)),
    );

    const result = await toggleProjectReactionAction({ projectId, type });
    if (result.ok) {
      setReactions(result.data);
    } else {
      setReactions(previous);
      setError(result.error);
    }
    setPendingType(null);
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Réactions au projet">
          {REACTION_TYPES.map((type) => {
            const { icon: Icon, label, color } = REACTION_CONFIG[type];
            const reaction = getReaction(type);
            const pending = pendingType === type;

            return (
              <Tooltip key={type} delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={reaction.hasReacted ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-1.5 rounded-full px-2.5",
                      reaction.hasReacted && "ring-1 ring-primary/25",
                    )}
                    onClick={() => void handleToggle(type)}
                    disabled={pendingType !== null}
                    aria-label={`${label} (${reaction.count})`}
                    aria-pressed={reaction.hasReacted}
                  >
                    {pending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Icon
                        className={cn(
                          "size-4",
                          color,
                          reaction.hasReacted && "fill-current",
                        )}
                      />
                    )}
                    <span className="text-xs font-medium tabular-nums">
                      {reaction.count}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {error ? (
          <p className="text-destructive text-xs" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
