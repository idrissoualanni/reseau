import { cn } from "@/lib/utils";

// Avatar avec repli sur les initiales : l'upload arrive avec F06 (stockage non
// tranché). Aucune image distante n'est affichée tant que le bucket n'existe pas.
type AvatarProps = {
  name: string;
  src?: string | null;
  size?: "md" | "lg";
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase();
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const dimensions = size === "lg" ? "size-16 text-xl" : "size-10 text-sm";

  return (
    <span
      className={cn(
        "bg-secondary text-secondary-foreground inline-flex items-center justify-center overflow-hidden rounded-full font-semibold",
        dimensions,
        className,
      )}
      aria-hidden={src ? undefined : true}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- bucket non configuré (F06)
        <img src={src} alt={`Avatar de ${name}`} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
