import { BadgeCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProofLevel, Skill } from "@/lib/types";

type SkillBadgeProps = {
  skill: Skill & { proofLevel?: ProofLevel };
  onRemove?: () => void;
};

// Pastille de compétence : la couleur ne porte pas le sens seule. Le niveau
// `demonstrated` est signalé par une icône ET un libellé lu par le lecteur
// d'écran ; `declared` est le niveau par défaut (design system §5).
export function SkillBadge({ skill, onRemove }: SkillBadgeProps) {
  const demonstrated = skill.proofLevel === "demonstrated";

  return (
    <Badge variant={demonstrated ? "success" : "secondary"} className="gap-1.5 py-1 pr-1.5">
      {demonstrated ? <BadgeCheck aria-hidden /> : null}
      <span>{skill.name}</span>
      <span className="sr-only">{demonstrated ? " (démontrée)" : " (déclarée)"}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Retirer ${skill.name}`}
          className="hover:bg-foreground/10 focus-visible:ring-ring -mr-1 rounded-full p-0.5 outline-none focus-visible:ring-2"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      ) : null}
    </Badge>
  );
}
