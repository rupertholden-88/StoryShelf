"use client";

import Link from "next/link";
import { CoverArt } from "@/components/BookArt";
import { BottomNav } from "@/components/BottomNav";
import { Gate } from "@/components/Gate";
import { BackIcon } from "@/components/Icons";
import { setStatus, useBooks } from "@/lib/books";
import { STATUSES } from "@/lib/types";

export default function ElsewherePage() {
  return <Gate>{() => <Elsewhere />}</Gate>;
}

/** Books that aren't on the bookcase: put away, lent out or passed on. They still count as owned. */
function Elsewhere() {
  const { books, loading } = useBooks();
  const groups = STATUSES.filter((s) => s.id !== "shelf")
    .map((s) => ({ ...s, books: books.filter((b) => b.status === s.id).sort((a, b) => a.title.localeCompare(b.title)) }))
    .filter((g) => g.books.length > 0);

  return (
    <>
      <header className="lib-header">
        <Link href="/" className="text-btn light back-link"><BackIcon />Library</Link>
        <h1 className="lib-title">Not on the shelves</h1>
        <p className="lib-sub tucked">Still yours, so they won't be suggested or scanned in twice.</p>
      </header>
      <main className="rec-list search-results">
        {loading ? (
          <p className="section-sub">Checking…</p>
        ) : groups.length === 0 ? (
          <p className="section-sub">Every book is on the shelves. To put one away, lend it or pass it on, open it and use "Where is it?".</p>
        ) : (
          groups.map((g) => (
            <section key={g.id} aria-labelledby={`g-${g.id}`}>
              <h2 id={`g-${g.id}`} className="section-title">{g.plural} <span className="section-count">{g.books.length}</span></h2>
              <ul className="shelf-hits">
                {g.books.map((b) => (
                  <li key={b.isbn} className="elsewhere-row">
                    <Link href={`/book/${b.isbn}`} className="shelf-hit">
                      <CoverArt book={b} width={44} height={58} />
                      <span>
                        <span className="hit-title">{b.title}</span>
                        <span className="hit-meta">{b.status === "lent" && b.lentTo ? `With ${b.lentTo}` : b.authors[0] ?? ""}</span>
                      </span>
                    </Link>
                    <button type="button" className="text-btn" onClick={() => setStatus(b.isbn, "shelf")} aria-label={`Put ${b.title} back on the shelf`}>
                      Back on shelf
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
      <BottomNav active="library" />
    </>
  );
}
