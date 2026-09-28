"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { CoverArt } from "@/components/BookArt";
import { Gate } from "@/components/Gate";
import { BackIcon, HeartIcon } from "@/components/Icons";
import { Stars } from "@/components/Stars";
import { callNumber } from "@/lib/appearance";
import { firstName } from "@/lib/auth";
import { rateBook, readAgain, removeBook, updateBook, useBook, useBooks } from "@/lib/books";
import { recommend } from "@/lib/recommend";
import { AGE_BANDS, THEMES, type AgeBand, type Book, type Household, type Rec } from "@/lib/types";

export default function BookPage() {
  const { isbn } = useParams<{ isbn: string }>();
  return <Gate>{({ user, household }) => <BookDetail isbn={isbn} user={user} household={household} />}</Gate>;
}

function BookDetail({ isbn, user, household }: { isbn: string; user: User; household: Household }) {
  const router = useRouter();
  const { book, loading } = useBook(isbn);
  const { books } = useBooks();
  const [editing, setEditing] = useState(false);
  const [recs, setRecs] = useState<Rec[] | null>(null);

  useEffect(() => {
    if (!book || books.length === 0) return;
    let live = true;
    recommend(books, [book], 4).then((r) => live && setRecs(r)).catch(() => live && setRecs([]));
    return () => { live = false; };
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

  const me = firstName(user);
  const mine = book.ratings[user.uid]?.stars ?? 0;
  const others = Object.entries(book.ratings).filter(([uid, r]) => uid !== user.uid && r.stars > 0);
  const child = household.childName || "Our";
  const favLabel = household.childName ? `${child}'s favourite` : "A favourite";
  const ageLabel = AGE_BANDS.find((b) => b.id === book.ageBand)?.label;
  const themes = (THEMES as readonly string[]).includes(book.theme) ? THEMES : [...THEMES, book.theme];

  const remove = async () => {
    if (!confirm(`Remove ${book.title} from the library?`)) return;
    await removeBook(book.isbn);
    router.push("/");
  };

  return (
    <div className="detail">
      <div className="detail-hero">
        <div className="detail-bar">
          <Link href="/" className="text-btn light"><BackIcon />Library</Link>
          <button type="button" className="text-btn light" aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? "Done" : "Edit"}</button>
        </div>
        <div className="detail-head">
          <CoverArt book={book} width={112} height={146} className="detail-cover" />
          <div className="detail-titles">
            <h1 className="detail-title">{book.title}</h1>
            <p className="detail-author">{book.authors.join(", ") || "Unknown author"}</p>
            <div className="tag-row">
              <span className="shelf-label">{book.theme}</span>
              {ageLabel && <span className="shelf-label">{ageLabel}</span>}
            </div>
          </div>
        </div>
        <div className="plank-top" aria-hidden="true" />
        <div className="plank thin" aria-hidden="true" />
      </div>

      <section className="catalogue-card" aria-label="Catalogue card">
        <div className="card-head">
          <span className="call-no">{callNumber(book)}</span>
          <span className="isbn">ISBN {book.isbn}</span>
        </div>

        {editing && (
          <div className="card-row card-edit">
            <div className="field-pair">
              <div>
                <label htmlFor="theme" className="field-label">Shelf</label>
                <select id="theme" className="field" value={book.theme} onChange={(e) => updateBook(book.isbn, { theme: e.target.value })}>
                  {themes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="age" className="field-label">Age</label>
                <select id="age" className="field" value={book.ageBand} onChange={(e) => updateBook(book.isbn, { ageBand: e.target.value as AgeBand })}>
                  {AGE_BANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>
            </div>
            <button type="button" className="btn btn-danger" onClick={remove}>Remove from library</button>
          </div>
        )}

        <div className="card-row">
          <span className="card-key">{me}</span>
          <Stars who={me} value={mine} onChange={(n) => rateBook(book.isbn, user.uid, me, n)} />
        </div>
        {others.map(([uid, r]) => (
          <div className="card-row" key={uid}>
            <span className="card-key">{r.name}</span>
            <Stars who={r.name} value={r.stars} />
          </div>
        ))}
        <div className="card-row">
          <span className="card-key">{favLabel}</span>
          <button type="button" className="icon-btn" aria-label={favLabel} aria-pressed={book.favourite} onClick={() => updateBook(book.isbn, { favourite: !book.favourite })}>
            <HeartIcon on={book.favourite} />
          </button>
        </div>
        <div className="card-row last">
          <span className="card-key">Read {book.readCount} {book.readCount === 1 ? "time" : "times"}</span>
          <button type="button" className="btn btn-small btn-outline" onClick={() => readAgain(book.isbn)}>Read it again</button>
        </div>
      </section>

      <section className="more" aria-labelledby="more">
        <div className="more-head">
          <div>
            <h2 id="more" className="section-title">More like this</h2>
            <p className="section-sub">Not on your shelves yet</p>
          </div>
          <Link href="/for-you" className="text-btn">See all and buy</Link>
        </div>
        {recs === null ? (
          <p className="section-sub">Looking for similar books…</p>
        ) : recs.length === 0 ? (
          <p className="section-sub">No similar books found yet. Rate a few more to help.</p>
        ) : (
          <div className="mini-grid">
            {recs.map((r) => (
              <Link key={r.key} href="/for-you" className="mini-rec">
                <CoverArt book={{ isbn: r.key, title: r.title, authors: [r.author], coverUrl: r.coverUrl, favourite: false }} width={76} height={98} />
                <span className="mini-title">{r.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
