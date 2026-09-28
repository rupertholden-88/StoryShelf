import { expect, it } from "vitest";
import { draftFrom } from "@/lib/draft";

it("guesses shelf, format and age from a lookup", () => {
  const d = draftFrom("9781409580959", {
    isbn: "9781409580959", title: "That's Not My Tractor", authors: ["Fiona Watt"], illustrators: ["Rachel Wells"],
    coverUrl: null, subjects: ["Tractors", "Toy and movable books"], pages: 10, physicalFormat: "Board book",
  });
  expect(d).toMatchObject({ title: "That's Not My Tractor", theme: "Vehicles", format: "board", ageBand: "1-2", illustrators: ["Rachel Wells"] });
});

it("gives a blank draft to fill in when nothing was found", () => {
  expect(draftFrom("9781409580959", null)).toMatchObject({ title: "", authors: [], theme: "Stories" });
});
