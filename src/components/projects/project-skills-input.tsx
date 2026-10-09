"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkillBadge } from "@/components/skill-badge";
import { MAX_SKILLS_PER_PROJECT } from "@/lib/validation/project";
import type { Skill } from "@/lib/types";

// Compétences d'un projet (F05) : autocomplétion sur le référentiel `/api/skills`,
// maximum 10, transmises au formulaire via des champs cachés `skillSlugs[]`.

// Miroir de `normalizeSkillName` (validation/skills) : le slug part au serveur,
// le nom affiché peut rester libre.
function toSlug(raw: string): string {
  const name = raw.trim().replace(/\s+/g, " ");
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 40);
}

type ProjectSkillsInputProps = {
  initialSkills?: Skill[];
  error?: string;
};

export function ProjectSkillsInput({ initialSkills = [], error }: ProjectSkillsInputProps) {
  const [selected, setSelected] = useState<Skill[]>(initialSkills);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);
  const listId = "project-skills-suggestions";

  const atLimit = selected.length >= MAX_SKILLS_PER_PROJECT;

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

  function add(skill: Skill) {
    if (atLimit || selected.some((item) => item.slug === skill.slug)) return;
    setSelected((previous) => [...previous, skill]);
    setValue("");
    setSuggestions([]);
  }

  function addFromLabel() {
    const slug = toSlug(value);
    if (slug.length === 0) return;
    const name = value.trim().replace(/\s+/g, " ");
    add({ id: slug, slug, name });
  }

  function remove(slug: string) {
    setSelected((previous) => previous.filter((item) => item.slug !== slug));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor="project-skill-input">Compétences</Label>
        <span className="text-muted-foreground text-xs">
          {selected.length}/{MAX_SKILLS_PER_PROJECT}
        </span>
      </div>

      {selected.map((skill) => (
        <input key={skill.slug} type="hidden" name="skillSlugs" value={skill.slug} />
      ))}

      {error ? (
        <p id="project-skills-error" role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Input
            id="project-skill-input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addFromLabel();
              }
            }}
            placeholder={atLimit ? "Limite atteinte" : "Ajoute une compétence (ex. React)"}
            disabled={atLimit}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={suggestions.length > 0 ? listId : undefined}
            aria-describedby={error ? "project-skills-error" : undefined}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addFromLabel}
          disabled={atLimit || value.trim().length === 0}
        >
          <Plus aria-hidden />
          Ajouter
        </Button>
      </div>

      {suggestions.length > 0 && !atLimit ? (
        <ul id={listId} className="flex flex-wrap gap-2" aria-label="Suggestions">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => add(suggestion)}
              >
                {suggestion.name}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {selected.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {selected.map((skill) => (
            <li key={skill.slug}>
              <SkillBadge skill={skill} onRemove={() => remove(skill.slug)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          Aucune compétence. Ajoute-en pour qu&apos;on te trouve sur ce que tu sais faire.
        </p>
      )}
    </div>
  );
}