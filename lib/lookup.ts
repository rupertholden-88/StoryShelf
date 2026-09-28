export interface LookupResult {
  isbn: string;
  title: string;
  authors: string[];
  illustrators: string[];
  coverUrl: string | null;
  subjects: string[];
  pages: number | null;
  physicalFormat: string | null;
}

/** Give up on a slow source after this long; the others usually have the book anyway. */
export const LOOKUP_TIMEOUT_MS = 8000;

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) });
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
    ...splitPeople(d, e, w, g),
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

type Person = { name?: string; role?: string };

/** Works out authors and illustrators from whichever sources have them. */
export function splitPeople(d: any, e: any, w: any, g: any): { authors: string[]; illustrators: string[] } {
  const by = parseByStatement(d?.by_statement ?? e?.by_statement);
  const contributors: Person[] = Array.isArray(e?.contributors) ? e.contributors : [];
  const contribIllustrators = contributors.filter((c) => /illustrat|artist|pictures/i.test(c.role || "")).map((c) => c.name || "");
  const contribAuthors = contributors.filter((c) => /author|writ|text/i.test(c.role || "")).map((c) => c.name || "");

  const illustrators = dedupe(firstNonEmpty(by.illustrators, contribIllustrators));
  const isIllustrator = (n: string) => illustrators.some((i) => same(i, n));

  // Open Library and Google often list the illustrator as a second author; keep them as illustrator only.
  const candidates = firstNonEmpty(
    d?.authors?.map((a: { name: string }) => a.name),
    w?.author_name,
    g?.authors,
    by.authors,
    contribAuthors
  );
  let authors = dedupe(candidates.filter((n) => !isIllustrator(n)));
  if (!authors.length && candidates.length) authors = dedupe(candidates.slice(0, 1));
  return { authors, illustrators: illustrators.filter((i) => !authors.some((a) => same(a, i))) };
}

/** "written by Anna Milbourne ; illustrated by Simona Dimitri" */
export function parseByStatement(by: unknown): { authors: string[]; illustrators: string[] } {
  if (typeof by !== "string") return { authors: [], illustrators: [] };
  const ill = by.match(/illustrat\w*\s+(?:by\s+)?([^;\[\]]+)/i)?.[1];
  const first = by.split(/[;\[]|illustrat/i)[0];
  const auth = first.replace(/^.*?\bby\b/i, "");
  return { authors: names(auth), illustrators: names(ill) };
}

function names(s: string | undefined): string[] {
  if (!s) return [];
  const clean = s.replace(/[.,:\s]+$/, "").replace(/^[,:\s]+/, "").trim();
  if (!clean || clean.length > 80) return [];
  return clean.split(/\s+and\s+|\s*&\s*|,\s*/).map((n) => n.trim()).filter((n) => n.length > 1);
}

const same = (a: string, b: string) => a.toLowerCase().replace(/[^a-z]/g, "") === b.toLowerCase().replace(/[^a-z]/g, "");
function dedupe(list: string[]): string[] {
  const out: string[] = [];
  for (const n of list) if (n && !out.some((o) => same(o, n))) out.push(n);
  return out;
}
