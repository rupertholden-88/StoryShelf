"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { CoverArt } from "@/components/BookArt";
import { Gate } from "@/components/Gate";
import { CloseIcon } from "@/components/Icons";
import { QuickAddPanel, useQuickAdd } from "@/components/QuickAdd";
import { Scanner } from "@/components/Scanner";
import { firstName } from "@/lib/auth";
import { addBook, getBook, type NewBook } from "@/lib/books";
import { draftFrom } from "@/lib/draft";
import { cleanIsbn } from "@/lib/isbn";
import { lookupIsbn } from "@/lib/lookup";
import { usePersisted } from "@/lib/persisted";
import { AGE_BANDS, THEMES, type AgeBand, type Book } from "@/lib/types";

type Phase =
  | { k: "scanning" }
  | { k: "looking"; isbn: string }
  | { k: "notIsbn"; code: string }
  | { k: "owned"; book: Book }
  | { k: "new"; draft: NewBook; found: boolean }
  | { k: "added"; book: NewBook };

export default function ScanPage() {
  return <Gate>{({ user }) => <ScanScreen user={user} />}</Gate>;
}

function ScanScreen({ user }: { user: User }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ k: "scanning" });
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [mode, setMode] = usePersisted<"one" | "quick">("nb-scan-mode", "one", ["one", "quick"]);
  const quick = useQuickAdd(firstName(user));

  const handleIsbn = async (isbn: string) => {
    setTyping(false);
    setProblem(null);
    setPhase({ k: "looking", isbn });
    try {
      const existing = await getBook(isbn);
      if (existing) {
        setPhase({ k: "owned", book: existing });
        return;
      }
      const res = await lookupIsbn(isbn);
      setPhase({ k: "new", found: !!res, draft: draftFrom(isbn, res) });
    } catch {
      setProblem("The book couldn't be checked. Check your connection and scan again.");
      setPhase({ k: "scanning" });
    }
  };

  // Arriving from search with a book picked: look it up straight away instead of scanning.
  // The camera waits for this check so it doesn't start (and ask permission) for nothing.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const isbn = cleanIsbn(new URLSearchParams(window.location.search).get("isbn") ?? "");
    if (isbn) {
      window.history.replaceState(window.history.state, "", "/scan");
      handleIsbn(isbn);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCode = (code: string) => {
    const isbn = cleanIsbn(code);
    if (isbn) handleIsbn(isbn);
    else setPhase({ k: "notIsbn", code });
  };

  // For books with a shop barcode instead of an ISBN (Jellycat and some toy-style books).
  const addByHand = async (code: string) => {
    setPhase({ k: "looking", isbn: code });
    const existing = await getBook(code).catch(() => null);
    if (existing) {
      setPhase({ k: "owned", book: existing });
      return;
    }
    setPhase({
      k: "new",
      found: false,
      draft: { isbn: code, title: "", authors: [], illustrators: [], coverUrl: null, subjects: [], pages: null, format: "board", theme: "Stories", ageBand: "1-2" },
    });
  };

  const submitTyped = (e: FormEvent) => {
    e.preventDefault();
    const isbn = cleanIsbn(typed);
    if (!isbn) {
      setTypedError("That isn't a valid ISBN. It's the 10 or 13 digit number under the barcode.");
      return;
    }
    setTypedError(null);
    handleIsbn(isbn);
  };

  const save = async (draft: NewBook) => {
    if (!draft.title.trim()) return;
    setSaving(true);
    try {
      await addBook({ ...draft, title: draft.title.trim() }, firstName(user));
      setPhase({ k: "added", book: draft });
    } catch {
      setProblem("The book couldn't be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const again = () => { setProblem(null); setPhase({ k: "scanning" }); };

  return (
    <div className="scan-screen">
      <Scanner
        active={ready && phase.k === "scanning" && !typing}
        continuous={mode === "quick"}
        onCode={mode === "quick" ? quick.onCode : handleCode}
      />

      <div className="scan-top">
        <Link href="/" className="icon-btn round" aria-label="Close scanner"><CloseIcon /></Link>
        <span className="scan-top-title">Scan a book</span>
        <span style={{ width: 44 }} />
      </div>

      <section className="sheet" aria-live="polite">
        <span className="grabber" aria-hidden="true" />
        {problem && <p className="form-error">{problem}</p>}

        {phase.k === "scanning" && (
          typing ? (
            <form onSubmit={submitTyped} className="stack">
              <label htmlFor="isbn" className="field-label">ISBN</label>
              <input id="isbn" className="field" inputMode="numeric" autoComplete="off" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="978…" />
              {typedError && <p className="form-error">{typedError}</p>}
              <div className="btn-row">
                <button type="submit" className="btn btn-dark">Look up book</button>
                <button type="button" className="btn btn-outline" onClick={() => setTyping(false)}>Use camera</button>
              </div>
            </form>
          ) : (
            <>
              <div className="segmented light-seg" role="group" aria-label="How to add books">
                <button type="button" aria-pressed={mode === "one"} onClick={() => setMode("one")}>One at a time</button>
                <button type="button" aria-pressed={mode === "quick"} onClick={() => setMode("quick")}>Quick add</button>
              </div>
              {mode === "quick" ? (
                <QuickAddPanel
                  quick={quick}
                  onAddByHand={(code) => (cleanIsbn(code) ? handleIsbn(cleanIsbn(code)!) : addByHand(code))}
                  onTypeIsbn={() => setTyping(true)}
                />
              ) : (
                <div className="stack">
                  <h2 className="sheet-title">Point at the barcode</h2>
                  <p className="sheet-note">It's on the back cover, usually with ISBN printed above it.</p>
                  <div className="btn-row">
                    <button type="button" className="btn btn-outline" onClick={() => setTyping(true)}>Type the ISBN</button>
                    <Link href="/search" className="btn btn-outline">Search by title</Link>
                  </div>
                </div>
              )}
            </>
          )
        )}

        {phase.k === "looking" && (
          <div className="stack">
            <h2 className="sheet-title">Looking it up…</h2>
            <p className="sheet-note">ISBN {phase.isbn}</p>
          </div>
        )}

        {phase.k === "notIsbn" && (
          <div className="stack">
            <h2 className="sheet-title">That's a shop barcode, not an ISBN</h2>
            <p className="sheet-note">
              Some books, like Jellycat ones, have a product barcode on the back. Look for the ISBN in small print, usually starting 978,
              on the back or inside the cover. If there isn't one, add the book by hand.
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn-dark" onClick={() => { setPhase({ k: "scanning" }); setTyping(true); }}>Type the ISBN</button>
              <button type="button" className="btn btn-outline" onClick={() => addByHand(phase.code)}>Add it by hand</button>
            </div>
            <Link href="/search" className="text-btn">Search for it by title</Link>
            <button type="button" className="text-btn" onClick={again}>Scan again</button>
          </div>
        )}

        {phase.k === "owned" && (
          <div className="stack">
            <BookHead book={phase.book} heading="Already on your shelf" />
            <dl className="facts">
              <div><dt>Shelf</dt><dd>{phase.book.theme}</dd></div>
              <div><dt>Added</dt><dd>{phase.book.addedAt ? phase.book.addedAt.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "–"}</dd></div>
              <div><dt>Read</dt><dd>{phase.book.readCount} {phase.book.readCount === 1 ? "time" : "times"}</dd></div>
            </dl>
            <div className="btn-row">
              <button type="button" className="btn btn-dark" onClick={again}>Scan another</button>
              <button type="button" className="btn btn-outline" onClick={() => router.push(`/book/${phase.book.isbn}`)}>Open book</button>
            </div>
          </div>
        )}

        {phase.k === "new" && (
          <DraftForm
            draft={phase.draft}
            found={phase.found}
            saving={saving}
            onChange={(draft) => setPhase({ ...phase, draft })}
            onSave={save}
            onCancel={again}
          />
        )}

        {phase.k === "added" && (
          <div className="stack">
            <BookHead book={{ ...phase.book, favourite: false }} heading="Added to the library" />
            <p className="sheet-note">It's on the {phase.book.theme} shelf.</p>
            <div className="btn-row">
              <button type="button" className="btn btn-dark" onClick={again}>Scan another</button>
              <button type="button" className="btn btn-outline" onClick={() => router.push(`/book/${phase.book.isbn}`)}>Open book</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function BookHead({ book, heading }: { book: Pick<Book, "isbn" | "title" | "authors" | "coverUrl" | "favourite"> & { illustrators?: string[] }; heading: string }) {
  return (
    <div className="book-head">
      <CoverArt book={book} width={64} height={84} />
      <div>
        <h2 className="sheet-title">{heading}</h2>
        <p className="sheet-book">{book.title}{book.authors[0] ? `, ${book.authors[0]}` : ""}</p>
        {book.illustrators?.[0] && <p className="sheet-note">Illustrated by {book.illustrators.join(", ")}</p>}
      </div>
    </div>
  );
}

function DraftForm({ draft, found, saving, onChange, onSave, onCancel }: {
  draft: NewBook; found: boolean; saving: boolean;
  onChange: (d: NewBook) => void; onSave: (d: NewBook) => void; onCancel: () => void;
}) {
  const themes = (THEMES as readonly string[]).includes(draft.theme) ? THEMES : [...THEMES, draft.theme];
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); onSave(draft); }}>
      {found ? (
        <BookHead book={{ ...draft, favourite: false }} heading="New to the library" />
      ) : (
        <>
          <h2 className="sheet-title">New book, no details found</h2>
          <p className="sheet-note">Add the title and author yourself. {/^97[89]/.test(draft.isbn) ? "ISBN" : "Barcode"} {draft.isbn}</p>
          <label htmlFor="title" className="field-label">Title</label>
          <input id="title" className="field" required value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} />
          <label htmlFor="author" className="field-label">Author</label>
          <input id="author" className="field" value={draft.authors[0] ?? ""} onChange={(e) => onChange({ ...draft, authors: e.target.value ? [e.target.value] : [] })} />
          <label htmlFor="illustrator" className="field-label">Illustrator</label>
          <input id="illustrator" className="field" value={draft.illustrators[0] ?? ""} onChange={(e) => onChange({ ...draft, illustrators: e.target.value ? [e.target.value] : [] })} />
        </>
      )}
      <div className="field-pair">
        <div>
          <label htmlFor="theme" className="field-label">Shelf</label>
          <select id="theme" className="field" value={draft.theme} onChange={(e) => onChange({ ...draft, theme: e.target.value })}>
            {themes.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="age" className="field-label">Age</label>
          <select id="age" className="field" value={draft.ageBand} onChange={(e) => onChange({ ...draft, ageBand: e.target.value as AgeBand })}>
            {AGE_BANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </div>
      </div>
      <div className="btn-row">
        <button type="submit" className="btn btn-dark" disabled={saving || !draft.title.trim()}>{saving ? "Adding…" : "Add to shelf"}</button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>Scan another</button>
      </div>
    </form>
  );
}
