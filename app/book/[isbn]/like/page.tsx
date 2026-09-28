"use client";

import Link from "next/link";
import { AffiliateNote } from "@/components/AffiliateNote";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Gate } from "@/components/Gate";
import { HitCard } from "@/components/HitCard";
import { BackIcon } from "@/components/Icons";
import { MoreByLinks } from "@/components/MoreByLinks";
import { useBook, useBooks, useWishlist, wishId } from "@/lib/books";
import { recommend } from "@/lib/recommend";
import type { Rec } from "@/lib/types";

export default function MoreLikePage() {
  const { isbn } = useParams<{ isbn: string }>();
  return <Gate>{() => <MoreLike isbn={isbn} />}</Gate>;
}

function MoreLike({ isbn }: { isbn: string }) {
  const { book, loading } = useBook(isbn);
  const { books } = useBooks();
  const { ids: wished } = useWishlist();
  const [recs, setRecs] = useState<Rec[] | null>(null);

  useEffect(() => {
    if (!book || books.length === 0) return;
    let live = true;
    setRecs(null);
    recommend(books, [book], 24).then((r) => live && setRecs(r)).catch(() => live && setRecs([]));
    return () => { live = false; };
    // Search again for a different book or when the shelves change size, not on every rating.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.isbn, books.length]);

  if (loading) return <div className="gate"><p className="gate-note">Finding the book…</p></div>;
  if (!book) {
    return (
      <div className="gate">
        <h1 className="gate-title">Not on the shelves</h1>
        <p className="gate-note">This book isn't in the library. It may have been removed.</p>
        <Link href="/" className="btn btn-light">Back to the library</Link>
      </div>
    );
  }

  return (
    <>
      <header className="lib-header">
        <Link href={`/book/${book.isbn}`} className="text-btn light back-link"><BackIcon />{book.title.length > 28 ? `${book.title.slice(0, 26).trimEnd()}…` : book.title}</Link>
        <h1 className="lib-title">More like {book.title}</h1>
        <p className="lib-sub tucked">Same author, illustrator or subjects, and not on your shelves yet</p>
        <MoreByLinks book={book} light />
      </header>

      <main className="rec-list">
        {recs === null ? (
          <p className="section-sub">Looking for similar books…</p>
        ) : recs.length === 0 ? (
          <p className="section-sub">No similar books found. Try searching by the author instead.</p>
        ) : (
          recs.map((r) => <HitCard key={r.key} rec={r} wished={wished.has(wishId(r))} showWhy />)
        )}
        <AffiliateNote />
      </main>

      <BottomNav active="library" />
    </>
  );
}
