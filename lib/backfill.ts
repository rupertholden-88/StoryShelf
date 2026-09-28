"use client";

import { useEffect, useRef } from "react";
import { updateBook } from "./books";
import { lookupIsbn } from "./lookup";
import type { Book } from "./types";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const LOOKUP_V = 2;

/** Quietly fills in missing authors and covers for books on the shelf, one at a time. */
export function useBackfill(books: Book[]) {
  const running = useRef(false);
  useEffect(() => {
    if (running.current) return;
    const todo = books.filter(
      (b) =>
        (b.lookedUpV ?? 0) < LOOKUP_V ||
        ((!b.authors.length || !b.illustrators.length || !b.coverUrl) && (!b.lookedUpAt || Date.now() - b.lookedUpAt > WEEK))
    );
    if (!todo.length) return;
    running.current = true;
    (async () => {
      for (const b of todo.slice(0, 10)) {
        try {
          const res = await lookupIsbn(b.isbn);
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
          await updateBook(b.isbn, patch);
        } catch {}
      }
      running.current = false;
    })();
  }, [books]);
}
