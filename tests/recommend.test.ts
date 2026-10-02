import { afterEach, describe, expect, it, vi } from "vitest";
import { recommend, suggestionAge, usefulSubjects } from "@/lib/recommend";
import type { Book } from "@/lib/types";

afterEach(() => vi.unstubAllGlobals());

const seed: Book = {
  isbn: "9780000000001", title: "Owl Babies", authors: ["Martin Waddell"], illustrators: [], coverUrl: null,
  subjects: [], theme: "Animals", ageBand: "2-3", format: "picture", pages: 32, favourite: true, readCount: 3, ratings: {}, status: "shelf",
};

it("leaves out translations and uses the English edition's ISBN", async () => {
  const docs = [
    { title: "Où est mon chaton ?", author_name: ["Fiona Watt"], isbn: ["9782746074989"], subject: ["Juvenile fiction"], cover_i: 5 },
    { title: "That's Not My Kitten", author_name: ["Fiona Watt"], isbn: ["9782746074989", "0746085702"], subject: ["Juvenile fiction"], cover_i: 6 },
  ];
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ docs }))));
  const recs = await recommend([seed], [{ ...seed, isbn: "9780000000009" }]);
  expect(recs.map((r) => [r.title, r.isbn, r.coverUrl])).toEqual([["That's Not My Kitten", "9780746085707", null]]);
});

it("skips suggestions with no author and puts ones with covers first", async () => {
  const docs = [
    { title: "No Cover Book", author_name: ["Martin Waddell"], subject: ["Juvenile fiction"] },
    { title: "Mystery Record", subject: ["Juvenile fiction"], cover_i: 9 },
    { title: "Can't You Sleep, Little Bear?", author_name: ["Martin Waddell"], subject: ["Juvenile fiction"], cover_i: 7 },
    { title: "Owl Babies", author_name: ["Martin Waddell"], subject: ["Juvenile fiction"] },
    { title: "Tax Law", author_name: ["Martin Waddell"], subject: ["Law"] },
  ];
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ docs }))));
  const recs = await recommend([seed], [seed]);
  expect(recs.map((r) => r.title)).toEqual(["Can't You Sleep, Little Bear?", "No Cover Book"]);
});

describe("usefulSubjects", () => {
  it("splits run-together subjects and drops broad ones", () => {
    expect(usefulSubjects(["Pictorial worksJuvenile fiction", "Farm animals", "Juvenile literature", "Fiction", "Tractors"]))
      .toEqual(["Farm animals", "Tractors"]);
  });
});

describe("suggestionAge", () => {
  it("borrows the age of the book it came from when the record says nothing", () => {
    expect(suggestionAge(["Juvenile fiction", "Animals"], null, "0-1")).toBe("0-1");
  });
  it("trusts page counts and baby/board subjects", () => {
    expect(suggestionAge(["Juvenile fiction"], 10, "3-5")).toBe("1-2");
    expect(suggestionAge(["Board books"], null, "3-5")).toBe("1-2");
    expect(suggestionAge(["Juvenile fiction"], 120, "0-1")).toBe("3-5");
  });
});
