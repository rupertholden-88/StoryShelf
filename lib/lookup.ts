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
  const [ol, edition, gb, olSearch] = await Promise.allSettled([
    getJson(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`),
    getJson(`https://openlibrary.org/isbn/${isbn}.json`),
    getJson(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`),
    getJson(`https://openlibrary.org/search.json?isbn=${isbn}&fields=title,author_name,cover_i,subject&limit=1`),
  ]);

  const d = ol.status === "fulfilled" ? ol.value?.[`ISBN:${isbn}`] : undefined;
  const e = edition.status === "fulfilled" ? edition.value : undefined;
  const g = gb.status === "fulfilled" ? gb.value?.items?.[0]?.volumeInfo : undefined;
  const w = olSearch.status === "fulfilled" ? olSearch.value?.docs?.[0] : undefined;

  const title: string | undefined = d?.title || e?.title || g?.title || w?.title;
  if (!title) return null;

  const subjects = [
    ...(d?.subjects?.map((s: { name: string }) => s.name) ?? []),
    ...(Array.isArray(e?.subjects) ? e.subjects : []),
    ...(g?.categories ?? []),
    ...(w?.subject?.slice(0, 20) ?? []),
  ].filter((s): s is string => typeof s === "string");

  return {
    isbn,
    title,
    authors: firstNonEmpty(
      d?.authors?.map((a: { name: string }) => a.name),
      w?.author_name,
      g?.authors,
      fromByStatement(d?.by_statement ?? e?.by_statement),
      e?.contributors?.map((c: { name: string }) => c.name)
    ),
    coverUrl:
      d?.cover?.medium ??
      (w?.cover_i ? `https://covers.openlibrary.org/b/id/${w.cover_i}-M.jpg` : null) ??
      g?.imageLinks?.thumbnail?.replace("http://", "https://").replace("&edge=curl", "") ??
      null,
    subjects: [...new Set(subjects)],
    pages: d?.number_of_pages ?? e?.number_of_pages ?? g?.pageCount ?? null,
    physicalFormat: e?.physical_format ?? null,
  };
}

function firstNonEmpty(...lists: (string[] | undefined)[]): string[] {
  for (const l of lists) if (Array.isArray(l) && l.length) return l;
  return [];
}

/** "written by Anna Milbourne ; illustrated by Simona Dimitri" -> ["Anna Milbourne"] */
function fromByStatement(by: unknown): string[] | undefined {
  if (typeof by !== "string") return undefined;
  const first = by.split(/[;\[]|illustrat/i)[0];
  const name = first.replace(/^.*?\bby\b/i, "").replace(/[.,:\s]+$/, "").trim();
  return name && name.length < 60 ? name.split(/\s+and\s+|\s*&\s*/).map((n) => n.trim()).filter(Boolean) : undefined;
}
