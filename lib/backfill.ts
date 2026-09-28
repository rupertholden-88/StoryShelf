"use client";

import { useEffect, useRef } from "react";
import { updateBook } from "./books";
import { lookupIsbn } from "./lookup";
import type { Book } from "./types";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const LOOKUP_V = 2;

/** Books whose details are worth looking up again. */
export function needsLookup(b: Book, now = Date.now()): boolean {
  if ((b.lookedUpV ?? 0) < LOOKUP_V) return true;
  const missing = !b.authors.length || !b.illustrators.length || !b.coverUrl;
  return missing && (!b.lookedUpAt || now - b.lookedUpAt > WEEK);
}

/**
 * Quietly fills in missing authors and covers for books on the shelf, one at a time, until none are left.
 * It rechecks the latest shelf before each lookup, so a book another phone has just finished is skipped,
 * and it only runs while the app is on screen.
 */
export function useBackfill(books: Book[]) {
  const latest = useRef(books);
  latest.current = books;
  const running = useRef(false);
  // Each book is tried at most once per session; failures (usually offline) wait for the next launch.
  const tried = useRef(new Set<string>());

  useEffect(() => {
    if (running.current || document.visibilityState !== "visible") return;
    const next = () => latest.current.find((b) => needsLookup(b) && !tried.current.has(b.isbn));
    if (!next()) return;
    running.current = true;
    (async () => {
      // A short random wait so two phones opening the app together rarely pick the same book.
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 2500));
      let b: Book | undefined;
      while (document.visibilityState === "visible" && (b = next())) {
        tried.current.add(b.isbn);
        try {
          await updateBook(b.isbn, patchFor(b, await lookupIsbn(b.isbn)));
        } catch {}
      }
      running.current = false;
    })();
  }, [books]);
}

function patchFor(b: Book, res: Awaited<ReturnType<typeof lookupIsbn>>): Partial<Book> {
  const patch: Partial<Book> = { lookedUpAt: Date.now(), lookedUpV: LOOKUP_V };
  if (res?.authors.length && !b.authors.length) patch.authors = res.authors;
  if (res?.illustrators.length && !b.illustrators.length) {
    patch.illustrators = res.illustrators;
    // Earlier lookups sometimes saved the illustrator as a second author.
    const trimmed = b.authors.filter((a) => !res.illustrators.includes(a));
    if (trimmed.length && trimmed.length !== b.authors.length) patch.authors = trimmed;
  }
  if (res?.coverUrl && !b.coverUrl) patch.coverUrl = res.coverUrl;
  if (res && res.subjects.length > b.subjects.length) patch.subjects = res.subjects;
  return patch;
}
