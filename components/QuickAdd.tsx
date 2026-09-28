"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { addBook, getBook, removeBook } from "@/lib/books";
import { draftFrom } from "@/lib/draft";
import { cleanIsbn } from "@/lib/isbn";
import { lookupIsbn } from "@/lib/lookup";

type Added = { isbn: string; title: string; theme: string; undone?: boolean };
type Stuck = { code: string; why: "not-found" | "shop-barcode" | "offline" };
type Latest = { kind: "added" | "owned" | "stuck" | "looking"; text: string };

/**
 * Quick add: every book scanned is looked up and put on its guessed shelf straight away, so a
 * whole collection can go in without tapping between books. Books it can't find wait in a list.
 */
export function useQuickAdd(addedBy: string) {
  const [added, setAdded] = useState<Added[]>([]);
  const [stuck, setStuck] = useState<Stuck[]>([]);
  const [latest, setLatest] = useState<Latest | null>(null);
  const seen = useRef(new Set<string>());
  const queue = useRef<string[]>([]);
  const running = useRef(false);

  const handle = async (code: string) => {
    const isbn = cleanIsbn(code);
    if (!isbn) {
      setStuck((s) => [{ code, why: "shop-barcode" }, ...s]);
      setLatest({ kind: "stuck", text: "Shop barcode, not an ISBN. Saved below to add by hand." });
      return;
    }
    setLatest({ kind: "looking", text: `Looking up ${isbn}…` });
    try {
      const owned = await getBook(isbn);
      if (owned) {
        navigator.vibrate?.([40, 60, 40]);
        setLatest({ kind: "owned", text: `Already on your shelf: ${owned.title}` });
        return;
      }
      const res = await lookupIsbn(isbn);
      if (!res) {
        setStuck((s) => [{ code: isbn, why: "not-found" }, ...s]);
        setLatest({ kind: "stuck", text: "No details found. Saved below to add by hand." });
        return;
      }
      const draft = draftFrom(isbn, res);
      await addBook(draft, addedBy);
      setAdded((a) => [{ isbn, title: draft.title, theme: draft.theme }, ...a]);
      setLatest({ kind: "added", text: `Added ${draft.title} to ${draft.theme}` });
    } catch {
      seen.current.delete(code); // let it be scanned again once back online
      setStuck((s) => [{ code: isbn, why: "offline" }, ...s]);
      setLatest({ kind: "stuck", text: "Couldn't check that one. Check your connection." });
    }
  };

  const onCode = (code: string) => {
    if (seen.current.has(code)) return;
    seen.current.add(code);
    queue.current.push(code);
    if (running.current) return;
    running.current = true;
    (async () => {
      let next: string | undefined;
      while ((next = queue.current.shift())) await handle(next);
      running.current = false;
    })();
  };

  const undo = async (isbn: string) => {
    await removeBook(isbn);
    setAdded((a) => a.map((b) => (b.isbn === isbn ? { ...b, undone: true } : b)));
    seen.current.delete(isbn);
  };

  const resolve = (code: string) => setStuck((s) => s.filter((x) => x.code !== code));

  return { onCode, added, stuck, latest, undo, resolve };
}

const WHY: Record<Stuck["why"], string> = {
  "not-found": "No details found",
  "shop-barcode": "Shop barcode",
  offline: "Couldn't check",
};

export function QuickAddPanel({ quick, onAddByHand, onTypeIsbn }: {
  quick: ReturnType<typeof useQuickAdd>;
  onAddByHand: (code: string) => void;
  onTypeIsbn: () => void;
}) {
  const { added, stuck, latest, undo, resolve } = quick;
  const kept = added.filter((a) => !a.undone).length;
  return (
    <div className="stack quick">
      <h2 className="sheet-title">{kept ? `${kept} added. Keep scanning` : "Scan book after book"}</h2>
      <p className={`quick-latest ${latest?.kind ?? ""}`} role="status">
        {latest?.text ?? "Each book goes straight onto its shelf. You can change shelves later."}
      </p>

      {stuck.length > 0 && (
        <details className="quick-list" open>
          <summary>Needs you ({stuck.length})</summary>
          <ul>
            {stuck.map((s) => (
              <li key={s.code}>
                <span><span className="quick-code">{s.code}</span> {WHY[s.why]}</span>
                <button type="button" className="text-btn" onClick={() => { resolve(s.code); onAddByHand(s.code); }}>Add by hand</button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {added.length > 0 && (
        <details className="quick-list">
          <summary>Added this time ({kept})</summary>
          <ul>
            {added.map((a) => (
              <li key={a.isbn}>
                <span className={a.undone ? "undone" : ""}>{a.title} <span className="quick-shelf">{a.theme}</span></span>
                {a.undone ? <span className="quick-shelf">Removed</span> : (
                  <button type="button" className="text-btn" onClick={() => undo(a.isbn)} aria-label={`Undo adding ${a.title}`}>Undo</button>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="btn-row">
        <button type="button" className="btn btn-outline" onClick={onTypeIsbn}>Type an ISBN</button>
        <Link href="/" className="btn btn-dark">Done</Link>
      </div>
    </div>
  );
}
