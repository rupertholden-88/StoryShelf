import { afterEach, expect, it, vi } from "vitest";
import { recommend } from "@/lib/recommend";
import type { Book } from "@/lib/types";

afterEach(() => vi.unstubAllGlobals());

const seed: Book = {
  isbn: "9780000000001", title: "Owl Babies", authors: ["Martin Waddell"], illustrators: [], coverUrl: null,
  subjects: [], theme: "Animals", ageBand: "2-3", format: "picture", pages: 32, favourite: true, readCount: 3, ratings: {},
};

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
