import { describe, expect, it } from "vitest";
import { cleanIsbn, coverCandidates, ean13Valid, isbn13to10, pickIsbn } from "@/lib/isbn";

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

it("pickIsbn takes the first valid ISBN", () => {
  expect(pickIsbn(["junk", "0143117165", "9780804429573"])).toBe("9780143117162");
  expect(pickIsbn(undefined)).toBeNull();
});

it("coverCandidates tries the saved cover, then Open Library, then Amazon", () => {
  expect(coverCandidates("9780143117162", "https://x/c.jpg")).toEqual([
    "https://x/c.jpg",
    "https://covers.openlibrary.org/b/isbn/9780143117162-M.jpg?default=false",
    "https://images-na.ssl-images-amazon.com/images/P/0143117165.01.L.jpg",
  ]);
  expect(coverCandidates("5034566610347", null)).toEqual([]);
});
