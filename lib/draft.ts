import type { NewBook } from "./books";
import { guessAge, guessFormat, guessTheme } from "./classify";
import type { LookupResult } from "./lookup";

/** A new book from a lookup, with its shelf, format and age guessed. With no lookup, a blank to fill in. */
export function draftFrom(isbn: string, res: LookupResult | null): NewBook {
  const subjects = res?.subjects ?? [];
  const format = guessFormat(res?.physicalFormat ?? null, res?.pages ?? null, subjects);
  return {
    isbn,
    title: res?.title ?? "",
    authors: res?.authors ?? [],
    illustrators: res?.illustrators ?? [],
    coverUrl: res?.coverUrl ?? null,
    subjects,
    pages: res?.pages ?? null,
    format,
    theme: guessTheme(subjects, res?.title ?? ""),
    ageBand: guessAge(format, subjects, res?.pages ?? null),
  };
}
