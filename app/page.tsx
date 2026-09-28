"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Gate } from "@/components/Gate";
import { CoversIcon, SearchIcon, SpinesIcon } from "@/components/Icons";
import { Shelf } from "@/components/Shelf";
import { arrange, type Mode, type View } from "@/lib/arrange";
import { useBackfill } from "@/lib/backfill";
import { useBooks } from "@/lib/books";
import { bandForMonths, childAgeMonths } from "@/lib/household";
import { usePersisted } from "@/lib/persisted";
import type { Household } from "@/lib/types";

export default function LibraryPage() {
  return <Gate>{({ household }) => <Library household={household} />}</Gate>;
}

const MODES: [Mode, string][] = [["theme", "Theme"], ["age", "Age"], ["author", "Author"]];

function Library({ household }: { household: Household }) {
  const { books, loading } = useBooks();
  useBackfill(books);
  const [mode, setMode] = usePersisted<Mode>("nb-mode", "theme", ["theme", "age", "author"]);
  const [view, setView] = usePersisted<View>("nb-view", "spines", ["spines", "covers"]);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  const childName = household.childName || "Our";
  const nowBand = bandForMonths(childAgeMonths(household));

  const shelves = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? books.filter((b) => (b.title + " " + b.authors.join(" ")).toLowerCase().includes(q)) : books;
    return arrange(list, mode, q ? null : nowBand);
  }, [books, mode, nowBand, query]);

  return (
    <>
      <header className="lib-header">
        <div className="lib-title-row">
          <div>
            <h1 className="lib-title">{household.childName ? `${childName}'s library` : "Our library"}</h1>
            <p className="lib-sub">{loading ? "Counting books…" : `${books.length} ${books.length === 1 ? "book" : "books"}`}</p>
          </div>
          <button
            type="button"
            className="icon-btn round"
            aria-label={searching ? "Close search" : "Search the library"}
            aria-expanded={searching}
            onClick={() => { setSearching(!searching); setQuery(""); }}
          >
            <SearchIcon />
          </button>
        </div>
        {searching && (
          <>
            <label htmlFor="q" className="visually-hidden">Search titles or authors</label>
            <input id="q" className="search" type="search" placeholder="Search titles or authors" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} />
          </>
        )}
        <div className="controls">
          <div className="segmented" role="group" aria-label="Arrange shelves by">
            {MODES.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="Show books as">
            <button type="button" className="seg-icon" aria-label="Show spines" aria-pressed={view === "spines"} onClick={() => setView("spines")}><SpinesIcon /></button>
            <button type="button" className="seg-icon" aria-label="Show covers" aria-pressed={view === "covers"} onClick={() => setView("covers")}><CoversIcon /></button>
          </div>
        </div>
      </header>

      <main className="bookcase">
        {!loading && books.length === 0 ? (
          <div className="bay empty-case">
            <p>The shelves are empty. Scan the barcode on the back of a book to add it.</p>
            <Link href="/scan" className="btn btn-mustard">Scan a book</Link>
          </div>
        ) : !loading && shelves.length === 0 ? (
          <div className="bay empty-case"><p>No books match “{query}”.</p></div>
        ) : (
          shelves.map((s) => <Shelf key={s.id} shelf={s} view={view} childName={childName} />)
        )}
      </main>

      <BottomNav active="library" />
    </>
  );
}
