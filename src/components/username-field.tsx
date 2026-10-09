"use client";

import { useId, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usernameSchema } from "@/lib/validation/profile";

type Status = "idle" | "checking" | "available" | "taken" | "invalid";

// Champ username avec vérification de disponibilité asynchrone (F03). La
// validation de forme réutilise le schéma serveur ; l'unicité est confirmée
// par /api/profiles/username-available (le serveur reste seul juge).
export function UsernameField({ error }: { error?: string }) {
  const fieldId = useId();
  const descriptionId = `${fieldId}-description`;
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);

  async function check(raw: string) {
    const requestId = ++requestSeq.current;

    if (raw.length === 0) {
      setStatus("idle");
      setMessage(null);
      return;
    }

    const parsed = usernameSchema.safeParse(raw);
    if (!parsed.success) {
      setStatus("invalid");
      setMessage(parsed.error.issues[0]?.message ?? "Nom invalide.");
      return;
    }

    setStatus("checking");
    setMessage("Vérification…");
    try {
      const response = await fetch(
        `/api/profiles/username-available?u=${encodeURIComponent(parsed.data)}`,
      );
      if (requestId !== requestSeq.current) return;
      if (!response.ok) {
        setStatus("idle");
        setMessage(null);
        return;
      }
      const data = (await response.json()) as { available: boolean };
      setStatus(data.available ? "available" : "taken");
      setMessage(data.available ? "Ce nom est disponible." : "Ce nom est déjà pris.");
    } catch {
      if (requestId === requestSeq.current) {
        setStatus("idle");
        setMessage(null);
      }
    }
  }

  function onChange(next: string) {
    const normalized = next.toLowerCase();
    setValue(normalized);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void check(normalized), 350);
  }

  const invalid = Boolean(error) || status === "invalid" || status === "taken";

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={fieldId}>Nom d&apos;utilisateur</Label>
      <Input
        id={fieldId}
        name="username"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => void check(value)}
        autoComplete="username"
        placeholder="p. ex. awa_diop"
        required
        spellCheck={false}
        aria-invalid={invalid || undefined}
        aria-describedby={descriptionId}
      />
      <p
        id={descriptionId}
        aria-live="polite"
        className={
          status === "available"
            ? "text-success flex items-center gap-1 text-xs"
            : status === "taken" || status === "invalid"
              ? "text-destructive flex items-center gap-1 text-xs"
              : "text-muted-foreground flex items-center gap-1 text-xs"
        }
      >
        {status === "checking" ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : null}
        {status === "available" ? <CircleCheck aria-hidden className="size-3.5" /> : null}
        {status === "taken" || status === "invalid" ? (
          <CircleAlert aria-hidden className="size-3.5" />
        ) : null}
        {error ?? message ?? "3 à 30 caractères : minuscules, chiffres, tiret bas (_)."}
      </p>
      <p className="text-muted-foreground text-xs">Non modifiable après la création.</p>
    </div>
  );
}
