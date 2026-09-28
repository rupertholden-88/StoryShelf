"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Gate } from "@/components/Gate";
import { CoversIcon, SearchIcon, SettingsIcon, SpinesIcon } from "@/components/Icons";
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

  const childName = household.childName || "Our";
  const nowBand = bandForMonths(childAgeMonths(household));

  const shelves = useMemo(() => arrange(books, mode, nowBand), [books, mode, nowBand]);

  return (
    <>
      <header className="lib-header">
        <div className="lib-title-row">
          <div>
            <h1 className="lib-title">{household.childName ? `${childName}'s library` : "Our library"}</h1>
            <p className="lib-sub">{loading ? "Counting books…" : `${books.length} ${books.length === 1 ? "book" : "books"}`}</p>
          </div>
          <div className="header-icons">
            <Link href="/search" className="icon-btn round" aria-label="Search">
              <SearchIcon />
            </Link>
            <Link href="/settings" className="icon-btn round" aria-label="Settings">
              <SettingsIcon />
            </Link>
          </div>
        </div>
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
        ) : (
          shelves.map((s) => <Shelf key={s.id} shelf={s} view={view} childName={childName} />)
        )}
      </main>

      <BottomNav active="library" />
    </>
  );
}
