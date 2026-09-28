import { describe, expect, it } from "vitest";
import { parseByStatement, splitPeople } from "@/lib/lookup";

describe("parseByStatement", () => {
  it("splits written by / illustrated by", () => {
    expect(parseByStatement("written by Anna Milbourne ; illustrated by Simona Dimitri")).toEqual({
      authors: ["Anna Milbourne"],
      illustrators: ["Simona Dimitri"],
    });
  });
  it("handles 'illustrated by' in square brackets and several authors", () => {
    expect(parseByStatement("by Julia Donaldson and Sue Hendra [illustrated by Axel Scheffler].")).toEqual({
      authors: ["Julia Donaldson", "Sue Hendra"],
      illustrators: ["Axel Scheffler"],
    });
  });
  it("ignores things that aren't strings", () => {
    expect(parseByStatement(undefined)).toEqual({ authors: [], illustrators: [] });
  });
});

describe("splitPeople", () => {
  it("keeps an illustrator listed as a second author as illustrator only", () => {
    const d = { authors: [{ name: "Julia Donaldson" }, { name: "Axel Scheffler" }], by_statement: "by Julia Donaldson ; illustrated by Axel Scheffler" };
    expect(splitPeople(d, undefined, undefined, undefined)).toEqual({ authors: ["Julia Donaldson"], illustrators: ["Axel Scheffler"] });
  });
  it("uses edition contributors when there is no by-statement", () => {
    const e = { contributors: [{ name: "Eric Carle", role: "Author" }, { name: "Bill Martin", role: "Text" }, { name: "Someone", role: "Illustrator" }] };
    expect(splitPeople(undefined, e, undefined, undefined)).toEqual({ authors: ["Eric Carle", "Bill Martin"], illustrators: ["Someone"] });
  });
  it("falls back to Google Books authors", () => {
    expect(splitPeople(undefined, undefined, undefined, { authors: ["Oliver Jeffers"] })).toEqual({ authors: ["Oliver Jeffers"], illustrators: [] });
  });
  it("keeps the first name if everyone looks like an illustrator", () => {
    const d = { authors: [{ name: "Axel Scheffler" }], by_statement: "illustrated by Axel Scheffler" };
    expect(splitPeople(d, undefined, undefined, undefined).authors).toEqual(["Axel Scheffler"]);
  });
});
