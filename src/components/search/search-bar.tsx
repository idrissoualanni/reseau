"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Skill } from "@/lib/types";

type SearchBarProps = {
  initial?: string;
};

// Champ de recherche avec autocomplétion (F09) : délai 250 ms + annulation
// des requêtes obsolètes (séquence). Le choix remplit le champ ; la
// navigation se fait via le formulaire (GET /search?skill=...).
export function SearchBar({ initial = "" }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [pending] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);
  const listId = "search-suggestions";

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
          `/api/skills?q=${encodeURIComponent(next.trim())}&limit=6`,
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

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSuggestions([]);
    const slug = value.trim();
    router.push(slug ? `/search?skill=${encodeURIComponent(slug)}` : "/search");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <div className="flex-1">
        <label htmlFor="skill-search" className="sr-only">
          Compétence
        </label>
        <Input
          id="skill-search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="ex. React"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={suggestions.length > 0 ? listId : undefined}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
        Rechercher
      </Button>

      {suggestions.length > 0 ? (
        <ul id={listId} className="flex flex-wrap gap-2" aria-label="Suggestions">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setValue(suggestion.name);
                  setSuggestions([]);
                  router.push(`/search?skill=${encodeURIComponent(suggestion.slug)}`);
                }}
                disabled={pending}
              >
                {suggestion.name}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}