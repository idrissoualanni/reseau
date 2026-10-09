"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { addSkillAction, removeSkillAction } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkillBadge } from "@/components/skill-badge";
import type { ProfileSkill, Skill } from "@/lib/types";

const MAX_SKILLS = 30;

// Saisie des compétences avec autocomplétion sur le référentiel (F04) : ajout
// libre normalisé côté serveur, max 30, suppression immédiate.
export function SkillsField({ initialSkills }: { initialSkills: ProfileSkill[] }) {
  const [skills, setSkills] = useState<ProfileSkill[]>(initialSkills);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);
  const listId = "skills-suggestions";

  const atLimit = skills.length >= MAX_SKILLS;

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    if (next.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const requestId = ++requestSeq.current;
      try {
        const response = await fetch(
          `/api/skills?q=${encodeURIComponent(next.trim())}&limit=8`,
        );
        if (requestId !== requestSeq.current) return;
        if (!response.ok) {
          setSuggestions([]);
          return;
        }
        const data = (await response.json()) as { items: Skill[] };
        setSuggestions(data.items);
      } catch {
        if (requestId === requestSeq.current) setSuggestions([]);
      }
    }, 250);
  }

  function add(name: string) {
    const trimmed = name.trim();
    if (!trimmed || atLimit) return;
    setError(null);
    startTransition(async () => {
      const result = await addSkillAction(trimmed);
      if (result.ok && "skill" in result) {
        setSkills((previous) =>
          [...previous, result.skill].sort((a, b) => a.name.localeCompare(b.name, "fr")),
        );
        setValue("");
        setSuggestions([]);
      } else if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function remove(skill: ProfileSkill) {
    setError(null);
    startTransition(async () => {
      const result = await removeSkillAction(skill.id);
      if (result.ok && "removedId" in result) {
        setSkills((previous) => previous.filter((item) => item.id !== result.removedId));
      } else if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="skills-heading">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="skills-heading" className="text-lg font-semibold">
          Compétences
        </h2>
        <span className="text-muted-foreground text-xs">
          {skills.length}/{MAX_SKILLS}
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          add(value);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="flex-1">
          <Label htmlFor="skill-input" className="sr-only">
            Ajouter une compétence
          </Label>
          <Input
            id="skill-input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={atLimit ? "Limite atteinte" : "Ajoute une compétence (ex. React)"}
            disabled={pending || atLimit}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={suggestions.length > 0 ? listId : undefined}
          />
        </div>
        <Button type="submit" disabled={pending || atLimit || value.trim().length === 0}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
          Ajouter
        </Button>
      </form>

      {suggestions.length > 0 && !atLimit ? (
        <ul id={listId} className="flex flex-wrap gap-2" aria-label="Suggestions">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => add(suggestion.name)}
                disabled={pending}
              >
                {suggestion.name}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {skills.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li key={skill.id}>
              <SkillBadge skill={skill} onRemove={() => remove(skill)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          Aucune compétence pour l&apos;instant. Ajoute-en pour être trouvable.
        </p>
      )}

      {atLimit ? (
        <p className="text-muted-foreground text-xs">
          Tu peux ajouter jusqu&apos;à {MAX_SKILLS} compétences.
        </p>
      ) : null}
    </section>
  );
}
