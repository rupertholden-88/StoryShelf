export interface LookupResult {
  isbn: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  subjects: string[];
  pages: number | null;
  physicalFormat: string | null;
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** Open Library first, Google Books to fill gaps. Both allow browser requests without a key. */
export async function lookupIsbn(isbn: string): Promise<LookupResult | null> {
  const [ol, edition, gb] = await Promise.allSettled([
    getJson(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`),
    getJson(`https://openlibrary.org/isbn/${isbn}.json`),
    getJson(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`),
  ]);

  const d = ol.status === "fulfilled" ? ol.value?.[`ISBN:${isbn}`] : undefined;
  const e = edition.status === "fulfilled" ? edition.value : undefined;
  const g = gb.status === "fulfilled" ? gb.value?.items?.[0]?.volumeInfo : undefined;

  const title: string | undefined = d?.title || e?.title || g?.title;
  if (!title) return null;

  const subjects = [
    ...(d?.subjects?.map((s: { name: string }) => s.name) ?? []),
    ...(Array.isArray(e?.subjects) ? e.subjects : []),
    ...(g?.categories ?? []),
  ].filter((s): s is string => typeof s === "string");

  return {
    isbn,
    title,
    authors: d?.authors?.map((a: { name: string }) => a.name) ?? g?.authors ?? [],
    coverUrl: d?.cover?.medium ?? g?.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
    subjects: [...new Set(subjects)],
    pages: d?.number_of_pages ?? e?.number_of_pages ?? g?.pageCount ?? null,
    physicalFormat: e?.physical_format ?? null,
  };
}
