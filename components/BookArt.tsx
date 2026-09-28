"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { bookColours, callNumber, spineSize } from "@/lib/appearance";
import { coverCandidates } from "@/lib/isbn";
import type { Book } from "@/lib/types";

const label = (b: Book) => `${b.title}${b.authors[0] ? ` by ${b.authors[0]}` : ""}${b.favourite ? ", a favourite" : ""}`;

export function BookSpine({ book }: { book: Book }) {
  const { bg, fg } = bookColours(book.isbn);
  const { w, h } = spineSize(book);
  return (
    <Link href={`/book/${book.isbn}`} className="spine" aria-label={label(book)} style={{ width: w, height: h, background: bg, color: fg }}>
      <span className="spine-title">{book.title}</span>
      <span className="spine-label">{callNumber(book)}</span>
    </Link>
  );
}

/** Real cover if one can be found, otherwise a coloured stand-in with the title. */
export function CoverArt({ book, width, height, className = "" }: {
  book: Pick<Book, "isbn" | "title" | "authors" | "coverUrl" | "favourite">;
  width: number;
  height: number;
  className?: string;
}) {
  const candidates = coverCandidates(book.isbn, book.coverUrl);
  const [idx, setIdx] = useState(0);
  const [ratio, setRatio] = useState<number | null>(null);
  const { bg, fg } = bookColours(book.isbn);
  const src = candidates[idx];
  // Once the real cover loads, the book takes the cover's own shape (square board books, wide landscape books).
  const shapedWidth = src && ratio ? Math.round(Math.min(Math.max(height * ratio, height * 0.55), height * 1.45)) : width;
  const style: CSSProperties = { width: shapedWidth, height, background: bg, color: fg };
  const next = () => { setRatio(null); setIdx((i) => i + 1); };
  return (
    <span className={`cover ${className}`} style={style}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={next}
          // Amazon and some others return a 1×1 placeholder instead of a 404.
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth < 20) next();
            else setRatio(img.naturalWidth / img.naturalHeight);
          }}
        />
      ) : (
        <>
          <span className="cover-title">{book.title}</span>
          <span className="cover-author">{book.authors[0]}</span>
        </>
      )}
      {book.favourite && <span className="ribbon" aria-hidden="true" />}
    </span>
  );
}

export function BookCover({ book }: { book: Book }) {
  return (
    <Link href={`/book/${book.isbn}`} className="cover-link" aria-label={label(book)}>
      <CoverArt book={book} width={book.format === "board" ? 96 : 92} height={book.format === "board" ? 96 : 124} />
    </Link>
  );
}

export function FaceOut({ book }: { book: Book }) {
  return (
    <Link href={`/book/${book.isbn}`} className="face-out" aria-label={label(book)}>
      <CoverArt book={book} width={94} height={126} />
    </Link>
  );
}
