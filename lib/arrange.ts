import { callNumber } from "./appearance";
import { AGE_BANDS, THEMES, type AgeBand, type Book } from "./types";

export type Mode = "theme" | "age" | "author";
export type View = "spines" | "covers";

export interface ShelfGroup {
  id: string;
  name: string;
  books: Book[];
  isNow?: boolean;
}

const byCall = (a: Book, b: Book) =>
  callNumber(a).localeCompare(callNumber(b)) || a.title.localeCompare(b.title);

const AUTHOR_SHELF_MIN = 4;

export function arrange(books: Book[], mode: Mode, nowBand: AgeBand | null): ShelfGroup[] {
  if (mode === "age") {
    return AGE_BANDS.map((band) => ({
      id: band.id,
      name: band.label,
      books: books.filter((b) => b.ageBand === band.id).sort(byCall),
      isNow: band.id === nowBand,
    })).filter((s) => s.books.length > 0 || s.isNow);
  }

  if (mode === "author") {
    const ranges: [string, string][] = [["A", "C"], ["D", "G"], ["H", "M"], ["N", "S"], ["T", "Z"]];
    const shelves: ShelfGroup[] = ranges.map(([from, to]) => ({
      id: from,
      name: `Authors ${from}–${to}`,
      books: books.filter((b) => {
        const c = callNumber(b)[0];
        return c >= from && c <= to;
      }).sort(byCall),
    }));
    const unknown = books.filter((b) => !/^[A-Z]/.test(callNumber(b)));
    if (unknown.length) shelves.push({ id: "unknown", name: "Author unknown", books: unknown });
    return shelves.filter((s) => s.books.length > 0);
  }

  // Theme: prolific authors get a shelf of their own, like the Julia Donaldson shelf.
  const counts = new Map<string, number>();
  for (const b of books) {
    const a = b.authors[0];
    if (a && !/various|anonymous/i.test(a)) counts.set(a, (counts.get(a) || 0) + 1);
  }
  const authorShelves = [...counts.entries()]
    .filter(([, n]) => n >= AUTHOR_SHELF_MIN)
    .map(([author]) => author);

  const rest = books.filter((b) => !authorShelves.includes(b.authors[0]));
  const themeNames = [...THEMES, ...new Set(rest.map((b) => b.theme).filter((t) => !(THEMES as readonly string[]).includes(t)))];

  return [
    ...themeNames.map((t) => ({ id: `t-${t}`, name: t, books: rest.filter((b) => b.theme === t).sort(byCall) })),
    ...authorShelves.map((a) => ({ id: `a-${a}`, name: a, books: books.filter((b) => b.authors[0] === a).sort(byCall) })),
  ].filter((s) => s.books.length > 0);
}
