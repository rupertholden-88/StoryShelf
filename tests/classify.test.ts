import { describe, expect, it } from "vitest";
import { guessAge, guessFormat, guessTheme } from "@/lib/classify";

describe("guessTheme", () => {
  it("matches subjects to shelves in priority order", () => {
    expect(guessTheme(["Nursery rhymes", "Animals"], "")).toBe("Rhymes & songs");
    expect(guessTheme(["Bedtime", "Bears"], "")).toBe("Bedtime");
    expect(guessTheme([], "Tractor Ted")).toBe("Vehicles");
  });
  it("matches word starts, not the middle of words", () => {
    expect(guessTheme(["Scars"], "")).toBe("Stories");
  });
  it("defaults to Stories", () => {
    expect(guessTheme(["Juvenile fiction"], "Untitled")).toBe("Stories");
  });
});

describe("guessFormat", () => {
  it("spots board books from the format or subjects", () => {
    expect(guessFormat("Board book", null, [])).toBe("board");
    expect(guessFormat(null, null, ["Board books"])).toBe("board");
  });
  it("treats short books as picture books", () => {
    expect(guessFormat(null, 32, [])).toBe("picture");
    expect(guessFormat(null, 200, [])).toBe("other");
  });
});

describe("guessAge", () => {
  it("puts baby books at 0–1 and board books at 1–2", () => {
    expect(guessAge("picture", ["Baby books"], 12)).toBe("0-1");
    expect(guessAge("board", [], 12)).toBe("1-2");
  });
  it("splits picture books by length", () => {
    expect(guessAge("picture", [], 24)).toBe("2-3");
    expect(guessAge("picture", [], 32)).toBe("3-5");
  });
  it("defaults longer children's books to 3–5 and others to 5+", () => {
    expect(guessAge("other", ["Juvenile fiction"], 120)).toBe("3-5");
    expect(guessAge("other", [], 300)).toBe("5+");
  });
});
