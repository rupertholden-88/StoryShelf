"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { bookColours, callNumber, spineSize } from "@/lib/appearance";
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

/** Real cover if Open Library/Google have one, otherwise a coloured stand-in. */
export function CoverArt({ book, width, height, className = "" }: {
  book: Pick<Book, "isbn" | "title" | "authors" | "coverUrl" | "favourite">;
  width: number;
  height: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const { bg, fg } = bookColours(book.isbn);
  const style: CSSProperties = { width, height, background: bg, color: fg };
  return (
    <span className={`cover ${className}`} style={style}>
      {book.coverUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.coverUrl} alt="" onError={() => setFailed(true)} loading="lazy" />
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
