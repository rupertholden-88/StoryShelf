"use client";

import Link from "next/link";
import { AffiliateNote } from "@/components/AffiliateNote";
import { useEffect, useMemo, useState } from "react";
import { CoverArt } from "@/components/BookArt";
import { BottomNav } from "@/components/BottomNav";
import { Gate } from "@/components/Gate";
import { HitCard } from "@/components/HitCard";
import { BackIcon } from "@/components/Icons";
import { useBooks, useWishlist, wishId } from "@/lib/books";
import { searchBooks, searchShelves, type Hit } from "@/lib/search";

export default function SearchPage() {
  return <Gate>{() => <Search />}</Gate>;
}

const MIN_CHARS = 3;
const SHELF_LIMIT = 8;

function Search() {
  const { books, loading } = useBooks();
  const { ids: wished } = useWishlist();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Start from ?q= so coming back to the page keeps the search.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  const q = query.trim();
  const onShelves = useMemo(() => searchShelves(books, q), [books, q]);

  useEffect(() => {
    const url = q ? `/search?q=${encodeURIComponent(q)}` : "/search";
    window.history.replaceState(window.history.state, "", url);
    setShowAll(false);
    if (q.length < MIN_CHARS || loading) { setHits(null); setFailed(false); return; }
    let live = true;
    setHits(null);
    setFailed(false);
    // Wait for a pause in typing before asking Open Library.
    const t = setTimeout(() => {
      searchBooks(q, books)
        .then((h) => live && setHits(h))
        .catch(() => { if (live) { setFailed(true); setHits([]); } });
    }, 400);
    return () => { live = false; clearTimeout(t); };
    // Re-search when the query changes, not on every shelf update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, loading]);

  const shelfShown = showAll ? onShelves : onShelves.slice(0, SHELF_LIMIT);

  return (
    <>
      <header className="lib-header">
        <Link href="/" className="text-btn light back-link"><BackIcon />Library</Link>
        <h1 className="lib-title">Search</h1>
        <label htmlFor="q" className="visually-hidden">Search by title, author or illustrator</label>
        <input
          id="q"
          className="search"
          type="search"
          placeholder="Title, author or illustrator"
          autoFocus
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      <main className="rec-list search-results" aria-live="polite">
        {!q ? (
          <p className="section-sub">Search your shelves and find new books to add or buy. Books without a barcode can be added from here too.</p>
        ) : (
          <>
            <section aria-labelledby="on-shelves">
              <h2 id="on-shelves" className="section-title">On your shelves</h2>
              {loading ? (
                <p className="section-sub">Checking the shelves…</p>
              ) : onShelves.length === 0 ? (
                <p className="section-sub">No books on your shelves match “{q}”.</p>
              ) : (
                <ul className="shelf-hits">
                  {shelfShown.map((b) => (
                    <li key={b.isbn}>
                      <Link href={`/book/${b.isbn}`} className="shelf-hit">
                        <CoverArt book={b} width={44} height={58} />
                        <span>
                          <span className="hit-title">{b.title}</span>
                          <span className="hit-meta">{[b.authors[0], b.theme].filter(Boolean).join(" · ")}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {onShelves.length > shelfShown.length && (
                <button type="button" className="text-btn" onClick={() => setShowAll(true)}>Show all {onShelves.length}</button>
              )}
            </section>

            <section aria-labelledby="other-books">
              <h2 id="other-books" className="section-title">Other books</h2>
              {q.length < MIN_CHARS ? (
                <p className="section-sub">Keep typing to search all books.</p>
              ) : hits === null ? (
                <p className="section-sub">Searching…</p>
              ) : failed ? (
                <p className="section-sub">The book search didn't answer. Check your connection and try again.</p>
              ) : hits.length === 0 ? (
                <p className="section-sub">No other books found for “{q}”.</p>
              ) : (
                <div className="hit-list">
                  {hits.map((h) => (
                    <HitCard key={h.key} rec={h} year={h.year} showAge={h.forChildren} wished={wished.has(wishId(h))} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
        <AffiliateNote />
      </main>

      <BottomNav active="library" />
    </>
  );
}
