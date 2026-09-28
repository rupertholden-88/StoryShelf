import Link from "next/link";
import type { Book } from "@/lib/types";

const searchFor = (q: string) => `/search?q=${encodeURIComponent(q)}`;

/** "More by …" and "More illustrated by …" shortcuts into search. */
export function MoreByLinks({ book, light = false }: { book: Pick<Book, "authors" | "illustrators">; light?: boolean }) {
  const author = book.authors.find((a) => !/various|anonymous/i.test(a));
  const illustrator = book.illustrators.find((i) => i !== author);
  if (!author && !illustrator) return null;
  return (
    <div className={`chip-row${light ? " light" : ""}`}>
      {author && <Link className="chip" href={searchFor(author)}>More by {author}</Link>}
      {illustrator && <Link className="chip" href={searchFor(illustrator)}>More illustrated by {illustrator}</Link>}
    </div>
  );
}
