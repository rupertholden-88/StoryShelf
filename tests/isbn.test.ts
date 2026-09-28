import { describe, expect, it } from "vitest";
import { cleanIsbn, coverCandidates, ean13Valid, editionCover, isbn13to10, pickEdition } from "@/lib/isbn";

describe("cleanIsbn", () => {
  it("accepts a valid ISBN-13 with punctuation", () => {
    expect(cleanIsbn("978-0-14-311716-2")).toBe("9780143117162");
  });
  it("converts an ISBN-10, including an X check digit", () => {
    expect(cleanIsbn("0-14-311716-5")).toBe("9780143117162");
    expect(cleanIsbn("080442957X")).toBe("9780804429573");
  });
  it("rejects a bad checksum", () => {
    expect(cleanIsbn("9780143117163")).toBeNull();
  });
  it("rejects shop barcodes that aren't books", () => {
    expect(cleanIsbn("5034566610347")).toBeNull();
  });
});

describe("ean13Valid", () => {
  it("accepts any valid EAN-13, not just ISBNs", () => {
    expect(ean13Valid("5034566610347")).toBe(true);
    expect(ean13Valid("5034566610345")).toBe(false);
  });
});

describe("isbn13to10", () => {
  it("round-trips 978 ISBNs", () => {
    expect(isbn13to10("9780804429573")).toBe("080442957X");
    expect(isbn13to10("9780143117162")).toBe("0143117165");
  });
  it("has no ISBN-10 for 979", () => {
    expect(isbn13to10("9791032305690")).toBeNull();
  });
});

describe("pickEdition", () => {
  it("prefers an English edition over a translation listed first", () => {
    // That's Not My Kitten: French "Où est mon chaton ?" (978-2) listed before the UK edition (978-0).
    expect(pickEdition(["9782746074989", "junk", "0746085702"])).toEqual({ isbn: "9780746085707", english: true });
  });
  it("counts 978-1 and 979-8 as English", () => {
    expect(pickEdition(["9781409580959"]).english).toBe(true);
    expect(pickEdition(["9798886631234"]).english).toBe(true);
  });
  it("falls back to the first valid ISBN, marked not English", () => {
    expect(pickEdition(["9788467580181", "9782746074989"])).toEqual({ isbn: "9788467580181", english: false });
    expect(pickEdition(undefined)).toEqual({ isbn: null, english: false });
  });
});

it("editionCover only uses the work's cover when there's no English edition", () => {
  expect(editionCover({ english: true }, 42)).toBeNull();
  expect(editionCover({ english: false }, 42)).toBe("https://covers.openlibrary.org/b/id/42-M.jpg");
  expect(editionCover({ english: false }, undefined)).toBeNull();
});

it("coverCandidates tries the saved cover, then Open Library, then Amazon", () => {
  expect(coverCandidates("9780143117162", "https://x/c.jpg")).toEqual([
    "https://x/c.jpg",
    "https://covers.openlibrary.org/b/isbn/9780143117162-M.jpg?default=false",
    "https://images-na.ssl-images-amazon.com/images/P/0143117165.01.L.jpg",
  ]);
  expect(coverCandidates("5034566610347", null)).toEqual([]);
});
