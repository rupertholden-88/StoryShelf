import { describe, expect, it } from "vitest";
import { arrange } from "@/lib/arrange";
import { needsLookup } from "@/lib/backfill";
import type { Book } from "@/lib/types";

let n = 0;
const book = (over: Partial<Book>): Book => ({
  isbn: String(9780000000000 + n++), title: "A book", authors: [], illustrators: [], coverUrl: null, subjects: [],
  theme: "Stories", ageBand: "3-5", format: "picture", pages: null, favourite: false, readCount: 0, ratings: {},
  ...over,
});

describe("arrange by theme", () => {
  it("gives an author with 4+ books their own shelf", () => {
    const jd = Array.from({ length: 4 }, (_, i) => book({ title: `JD ${i}`, authors: ["Julia Donaldson"], theme: "Animals" }));
    const other = book({ title: "Owl Babies", authors: ["Martin Waddell"], theme: "Animals" });
    const shelves = arrange([...jd, other], "theme", null);
    expect(shelves.map((s) => s.name)).toEqual(["Animals", "Julia Donaldson"]);
    expect(shelves[0].books).toEqual([other]);
  });
  it("keeps custom shelves after the standard ones", () => {
    const shelves = arrange([book({ theme: "Seaside" }), book({ theme: "Bedtime" })], "theme", null);
    expect(shelves.map((s) => s.name)).toEqual(["Bedtime", "Seaside"]);
  });
});

describe("arrange by age", () => {
  it("always shows the child's current age shelf, even when empty", () => {
    const shelves = arrange([book({ ageBand: "3-5" })], "age", "1-2");
    expect(shelves.map((s) => [s.id, s.isNow ?? false])).toEqual([["1-2", true], ["3-5", false]]);
  });
});

describe("arrange by author", () => {
  it("files by surname and collects unknown authors", () => {
    const shelves = arrange([book({ authors: ["Eric Carle"] }), book({ authors: ["Oliver Jeffers"] }), book({ authors: [] })], "author", null);
    expect(shelves.map((s) => s.name)).toEqual(["Authors A–C", "Authors H–M", "Author unknown"]);
  });
});

describe("needsLookup", () => {
  const now = Date.UTC(2026, 0, 31);
  const day = 24 * 60 * 60 * 1000;
  it("rechecks books from an older lookup version", () => {
    expect(needsLookup(book({ authors: ["A"], illustrators: ["B"], coverUrl: "c", lookedUpV: 1 }), now)).toBe(true);
  });
  it("retries books with missing details once a week", () => {
    const b = book({ authors: [], lookedUpV: 2 });
    expect(needsLookup({ ...b, lookedUpAt: now - 2 * day }, now)).toBe(false);
    expect(needsLookup({ ...b, lookedUpAt: now - 8 * day }, now)).toBe(true);
  });
  it("leaves complete books alone", () => {
    expect(needsLookup(book({ authors: ["A"], illustrators: ["B"], coverUrl: "c", lookedUpV: 2 }), now)).toBe(false);
  });
});
