import { describe, expect, it } from "vitest";
import { formatDayLabel, groupPostsByDay } from "@/lib/posts-grouping";

function edge(id: string, createdAt: string) {
  return { cursor: id, post: { id, createdAt }, author: null, comments: [] };
}

const now = "2026-10-11T12:00:00.000Z";

describe("groupPostsByDay", () => {
  it("regroupe par jour en conservant l'ordre du fil", () => {
    const items = [
      edge("a", "2026-10-11T09:00:00.000Z"),
      edge("b", "2026-10-11T08:00:00.000Z"),
      edge("c", "2026-10-10T20:00:00.000Z"),
      edge("d", "2026-10-05T10:00:00.000Z"),
    ];

    const groups = groupPostsByDay(items, now);

    expect(groups.map((group) => group.key)).toEqual([
      "2026-10-11",
      "2026-10-10",
      "2026-10-05",
    ]);
    expect(groups[0].items.map((item) => item.post.id)).toEqual(["a", "b"]);
    expect(groups[0].label).toBe("Aujourd'hui");
    expect(groups[1].label).toBe("Hier");
  });

  it("ne fusionne pas deux jours distincts de la même semaine", () => {
    const groups = groupPostsByDay(
      [edge("a", "2026-10-08T10:00:00.000Z"), edge("b", "2026-10-07T10:00:00.000Z")],
      now,
    );

    expect(groups).toHaveLength(2);
  });

  it("renvoie un tableau vide quand il n'y a aucun post", () => {
    expect(groupPostsByDay([], now)).toEqual([]);
  });
});

describe("formatDayLabel", () => {
  const reference = new Date(now);

  it("dit « Aujourd'hui » pour le jour courant", () => {
    expect(formatDayLabel(new Date("2026-10-11T00:30:00.000Z"), reference)).toBe("Aujourd'hui");
  });

  it("dit « Hier » pour la veille", () => {
    expect(formatDayLabel(new Date("2026-10-10T23:30:00.000Z"), reference)).toBe("Hier");
  });

  it("formate une date plus ancienne avec le jour de la semaine", () => {
    const label = formatDayLabel(new Date("2026-10-05T10:00:00.000Z"), reference);

    expect(label).toContain("5");
    expect(label.toLowerCase()).toContain("octobre");
  });

  it("ajoute l'année quand elle diffère de l'année courante", () => {
    const label = formatDayLabel(new Date("2025-12-31T10:00:00.000Z"), reference);

    expect(label).toContain("2025");
  });
});
