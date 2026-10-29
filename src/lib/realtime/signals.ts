// Fenêtres des signaux temps réel (F34). Pures pour rester testables.

export const TYPING_WINDOW_MS = 6_000;
export const PRESENCE_WINDOW_MS = 90_000;

function age(value: string | null | undefined, now: number): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return Math.max(0, now - time);
}

export function isTyping(updatedAt: string | null | undefined, now: number): boolean {
  const elapsed = age(updatedAt, now);
  return elapsed !== null && elapsed <= TYPING_WINDOW_MS;
}

export function isOnline(lastSeenAt: string | null | undefined, now: number): boolean {
  const elapsed = age(lastSeenAt, now);
  return elapsed !== null && elapsed <= PRESENCE_WINDOW_MS;
}

export function presenceLabel(lastSeenAt: string | null | undefined, now: number): string {
  const elapsed = age(lastSeenAt, now);
  if (elapsed === null) return "Hors ligne";
  if (elapsed <= PRESENCE_WINDOW_MS) return "En ligne";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `Vu il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Vu il y a ${hours} h`;
  return "Hors ligne";
}
