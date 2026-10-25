"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, PartyPopper, Lightbulb, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ReactionType = "like" | "celebrate" | "insight" | "curious";

const REACTION_CONFIG: Record<ReactionType, { icon: React.ElementType; label: string; color: string }> = {
  like: { icon: ThumbsUp, label: "J'aime", color: "text-blue-500" },
  celebrate: { icon: PartyPopper, label: "Célébrer", color: "text-orange-500" },
  insight: { icon: Lightbulb, label: "Instructif", color: "text-yellow-500" },
  curious: { icon: HelpCircle, label: "Curieux", color: "text-purple-500" },
};

type ProjectReactionsProps = {
  projectId: string;
  initialReactions?: { type: ReactionType; count: number; hasReacted: boolean }[];
};

export function ProjectReactions({ projectId, initialReactions = [] }: ProjectReactionsProps) {
  const [reactions, setReactions] = useState(initialReactions);
  const [pending, startTransition] = useTransition();

  const reactionTypes: ReactionType[] = ["like", "celebrate", "insight", "curious"];

  const getReaction = (type: ReactionType) => reactions.find((r) => r.type === type) ?? { type, count: 0, hasReacted: false };

  async function handleToggle(type: ReactionType) {
    const reaction = getReaction(type);
    const newHasReacted = !reaction.hasReacted;
    const newCount = reaction.count + (newHasReacted ? 1 : -1);

    // Optimistic update
    startTransition(() => {
      setReactions((prev) =>
        prev.map((r) => (r.type === type ? { ...r, count: newCount, hasReacted: newHasReacted } : r))
      );
    });

    try {
      // TODO: Call GraphQL mutation
      // const result = await addProjectReaction({ projectId, type });
      // setReactions(result);
      console.log("Toggle reaction:", { projectId, type, hasReacted: newHasReacted });
    } catch (error) {
      // Rollback on error
      startTransition(() => {
        setReactions((prev) =>
          prev.map((r) => (r.type === type ? { ...r, count: reaction.count, hasReacted: reaction.hasReacted } : r))
        );
      });
      console.error("Failed to toggle reaction:", error);
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1" role="group" aria-label="Réactions au projet">
        {reactionTypes.map((type) => {
          const { icon: Icon, label, color } = REACTION_CONFIG[type];
          const reaction = getReaction(type);
          
          return (
            <Tooltip key={type} delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant={reaction.hasReacted ? "secondary" : "ghost"}
                  size="icon"
                  className={`h-8 w-8 transition-colors ${reaction.hasReacted ? "bg-primary/10" : ""}`}
                  onClick={() => handleToggle(type)}
                  disabled={pending}
                  aria-label={label}
                  aria-pressed={reaction.hasReacted}
                >
                  <Icon className={`size-4 ${color} ${reaction.hasReacted ? "fill-current" : ""}`} />
                  {reaction.count > 0 && (
                    <span className="ml-1 text-xs font-medium">{reaction.count}</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <p>{label} ({reaction.count})</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}