import { afterEach, describe, expect, it, vi } from "vitest";
import { searchBooks, searchShelves } from "@/lib/search";
import type { Book } from "@/lib/types";

const book = (over: Partial<Book>): Book => ({
  isbn: "9780000000000", title: "A book", authors: [], illustrators: [], coverUrl: null, subjects: [],
  theme: "Stories", ageBand: "3-5", format: "picture", pages: null, favourite: false, readCount: 0, ratings: {}, status: "shelf",
  ...over,
});

describe("searchShelves", () => {
  const shelf = [
    book({ isbn: "1", title: "The Gruffalo", authors: ["Julia Donaldson"], illustrators: ["Axel Scheffler"], theme: "Animals" }),
    book({ isbn: "2", title: "Room on the Broom", authors: ["Julia Donaldson"], theme: "Stories" }),
    book({ isbn: "3", title: "Owl Babies", authors: ["Martin Waddell"], subjects: ["Owls", "Mothers"], theme: "Animals" }),
  ];
  it("matches every word across title, people, shelf and subjects", () => {
    expect(searchShelves(shelf, "donaldson").map((b) => b.isbn)).toEqual(["2", "1"]); // alphabetical when no title matches
    expect(searchShelves(shelf, "scheffler gruff").map((b) => b.isbn)).toEqual(["1"]);
    expect(searchShelves(shelf, "mothers").map((b) => b.isbn)).toEqual(["3"]);
    expect(searchShelves(shelf, "animals donaldson").map((b) => b.isbn)).toEqual(["1"]);
  });
  it("puts title matches first", () => {
    const list = [book({ isbn: "a", title: "Bears", authors: ["Owl Person"] }), book({ isbn: "b", title: "Owl at Home" })];
    expect(searchShelves(list, "owl").map((b) => b.isbn)).toEqual(["b", "a"]);
  });
  it("returns nothing for an empty query", () => {
    expect(searchShelves(shelf, "  ")).toEqual([]);
  });
});

describe("searchBooks", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("puts children's books first, skips owned titles and repeats", async () => {
    const docs = [
      { key: "/works/1", title: "The Gruffalo", author_name: ["Julia Donaldson"], isbn: ["0333710932"], subject: ["Juvenile fiction"] },
      { key: "/works/2", title: "Gruffalo Crumble", author_name: ["A Chef"], subject: ["Cooking"], first_publish_year: 2015 },
      { key: "/works/3", title: "The Gruffalo's Child", author_name: ["Julia Donaldson"], isbn: ["9781405020466"], subject: ["Picture books"], cover_i: 42 },
      { key: "/works/4", title: "THE GRUFFALO'S CHILD", subject: ["Children's stories"] },
    ];
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ docs }))));
    const hits = await searchBooks("gruffalo", [book({ title: "The Gruffalo" })]);
    expect(hits.map((h) => [h.title, h.forChildren])).toEqual([["The Gruffalo's Child", true], ["Gruffalo Crumble", false]]);
    // English edition: the cover comes from its ISBN, not the work's (possibly foreign) cover.
    expect(hits[0]).toMatchObject({ isbn: "9781405020466", coverUrl: null, author: "Julia Donaldson" });
    expect(hits[1]).toMatchObject({ isbn: null, year: 2015, author: "A Chef" });
  });

  it("reports a failed search", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    await expect(searchBooks("zog", [])).rejects.toThrow();
  });
});
