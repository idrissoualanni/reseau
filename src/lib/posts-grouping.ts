// Groupement temporel du fil de posts (F11) : sections par jour en UTC pour un
// rendu stable (mêmes libellés côté serveur et client). Deux jours distincts ne
// sont jamais fusionnés.

const DAY_MS = 24 * 60 * 60 * 1000;

export type PostGroup<T> = {
  key: string;
  label: string;
  items: T[];
};

type Dated = { post: { createdAt: string } };

function utcDayStart(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function dayKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Libellé d'un groupe : « Aujourd'hui », « Hier », sinon la date lisible.
export function formatDayLabel(date: Date, now: Date): string {
  const diffDays = Math.round((utcDayStart(now) - utcDayStart(date)) / DAY_MS);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";

  const sameYear = date.getUTCFullYear() === now.getUTCFullYear();
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  }).format(date);
}

// Regroupe des éléments datés en conservant l'ordre reçu (fil déjà trié du plus
// récent au plus ancien). `nowIso` est injecté pour un rendu déterministe.
export function groupPostsByDay<T extends Dated>(items: T[], nowIso: string): PostGroup<T>[] {
  const now = new Date(nowIso);
  const groups: PostGroup<T>[] = [];
  let current: PostGroup<T> | null = null;

  for (const item of items) {
    const date = new Date(item.post.createdAt);
    const key = dayKey(date);
    if (!current || current.key !== key) {
      current = { key, label: formatDayLabel(date, now), items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }

  return groups;
}
