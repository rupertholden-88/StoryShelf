import { guessAge, guessFormat } from "./classify";
import { editionCover, pickEdition } from "./isbn";
import { LOOKUP_TIMEOUT_MS } from "./lookup";
import { KID, titleKey } from "./recommend";
import type { Book, Rec } from "./types";

/** A book found on Open Library, shaped like a suggestion so it can be saved and shopped for the same way. */
export type Hit = Rec & { year: number | null; forChildren: boolean };

const words = (q: string) => q.toLowerCase().split(/\s+/).filter(Boolean);

/** Books on the shelves matching every word of the query, in title, people, shelf or subjects. */
export function searchShelves(books: Book[], q: string): Book[] {
  const ws = words(q);
  if (!ws.length) return [];
  const hay = (b: Book) => [b.title, ...b.authors, ...b.illustrators, b.theme, ...b.subjects].join(" ").toLowerCase();
  const titleHits = (b: Book) => ws.filter((w) => b.title.toLowerCase().includes(w)).length;
  return books
    .filter((b) => ws.every((w) => hay(b).includes(w)))
    .sort((a, b) => titleHits(b) - titleHits(a) || a.title.localeCompare(b.title));
}

/** Open Library search by title or author, children's books first, leaving out ones already on the shelves. */
export async function searchBooks(q: string, owned: Book[]): Promise<Hit[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&language=eng&limit=30&fields=key,title,author_name,isbn,cover_i,subject,first_publish_year`;
  const res = await fetch(url, { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`search ${res.status}`);
  const docs: any[] = (await res.json()).docs ?? [];
  const ownedTitles = new Set(owned.map((b) => titleKey(b.title)));
  const seen = new Set<string>();
  const hits: Hit[] = [];
  for (const d of docs) {
    if (!d.title) continue;
    const key = titleKey(d.title);
    if (!key || ownedTitles.has(key) || seen.has(key)) continue;
    seen.add(key);
    const subjects: string[] = d.subject ?? [];
    const edition = pickEdition(d.isbn);
    hits.push({
      key,
      isbn: edition.isbn,
      title: d.title,
      author: d.author_name?.[0] ?? "Unknown author",
      coverUrl: editionCover(edition, d.cover_i),
      ageBand: guessAge(guessFormat(null, null, subjects), subjects, null),
      why: "Found by search",
      score: 0,
      year: typeof d.first_publish_year === "number" ? d.first_publish_year : null,
      forChildren: subjects.some((s) => KID.test(s)),
    });
  }
  // Stable sort keeps Open Library's relevance order within each group.
  return hits.sort((a, b) => Number(b.forChildren) - Number(a.forChildren));
}
