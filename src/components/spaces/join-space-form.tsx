"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinSpaceAction } from "@/lib/actions/spaces";
import type { SpaceAccessKind } from "@/lib/types";

const METHOD_LABELS: Record<SpaceAccessKind, string> = {
  open: "Rejoindre",
  invite_code: "Code d'invitation",
  invite_link: "Lien d'invitation",
  manual_approval: "Demander l'accès",
};

type JoinSpaceFormProps = {
  slug: string;
  methods: SpaceAccessKind[];
  // Jeton lu depuis `?invite=` par la page (jamais en clair dans le client si absent).
  inviteToken?: string;
};

// Formulaire d'adhésion (F15) : l'utilisateur choisit une méthode active, le
// serveur décide ensuite s'il rejoint ou s'il doit être approuvé.
export function JoinSpaceForm({ slug, methods, inviteToken }: JoinSpaceFormProps) {
  const [method, setMethod] = useState<SpaceAccessKind>(methods[0] ?? "open");
  const [state, formAction, pending] = useActionState(joinSpaceAction, {});

  const needsCode = method === "invite_code";
  const usesLink = method === "invite_link";
  const linkIncomplete = usesLink && !inviteToken;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="method" value={method} />
      {usesLink ? <input type="hidden" name="token" value={inviteToken ?? ""} /> : null}

      {methods.length > 1 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Comment rejoindre cet espace ?</legend>
          {methods.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="methodChoice"
                value={value}
                checked={method === value}
                onChange={() => setMethod(value)}
                className="accent-primary"
              />
              {METHOD_LABELS[value]}
            </label>
          ))}
        </fieldset>
      ) : null}

      {needsCode ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Code d&apos;invitation</Label>
          <Input
            id="code"
            name="code"
            autoComplete="off"
            aria-invalid={state.fieldErrors?.code ? true : undefined}
            aria-describedby={state.fieldErrors?.code ? "code-error" : undefined}
          />
          {state.fieldErrors?.code ? (
            <p id="code-error" role="alert" className="text-destructive text-sm">
              {state.fieldErrors.code}
            </p>
          ) : null}
        </div>
      ) : null}

      {linkIncomplete ? (
        <p role="alert" className="text-destructive text-sm">
          Ce lien d&apos;invitation est incomplet.
        </p>
      ) : null}

      <Button type="submit" disabled={pending || linkIncomplete} className="self-start">
        {pending ? "…" : METHOD_LABELS[method]}
      </Button>

      {state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-success text-sm">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
