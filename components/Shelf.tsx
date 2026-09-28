import type { ShelfGroup, View } from "@/lib/arrange";
import { BookCover, BookSpine, FaceOut } from "./BookArt";

export function Shelf({ shelf, view, childName }: { shelf: ShelfGroup; view: View; childName: string }) {
  const face = view === "spines" ? shelf.books.find((b) => b.favourite) : undefined;
  const spines = face ? shelf.books.filter((b) => b !== face) : shelf.books;

  return (
    <section className="bay" aria-label={`${shelf.name} shelf`}>
      <div className={`row ${view === "covers" ? "row-covers" : ""}`}>
        {view === "spines" ? (
          <>
            {spines.map((b) => <BookSpine key={b.isbn} book={b} />)}
            {face && <FaceOut book={face} />}
            <span className="bookend" aria-hidden="true" />
          </>
        ) : (
          shelf.books.map((b) => <BookCover key={b.isbn} book={b} />)
        )}
        {shelf.books.length === 0 && <span className="empty-shelf">Nothing on this shelf yet</span>}
      </div>
      <div className="plank-top" aria-hidden="true" />
      <div className="plank">
        <span className="shelf-label">
          {shelf.name}
          <span className="shelf-count">{shelf.books.length} {shelf.books.length === 1 ? "book" : "books"}</span>
        </span>
        {shelf.isNow && <span className="now-tag">{childName} is here</span>}
      </div>
    </section>
  );
}
