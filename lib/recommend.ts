import { guessAge, guessFormat } from "./classify";
import { editionCover, pickEdition } from "./isbn";
import { LOOKUP_TIMEOUT_MS } from "./lookup";
import type { Book, Rec } from "./types";

export const KID = /juvenile|children|picture book|board book|toddler|baby|nursery|preschool/i;
const GENERIC = /^(fiction|juvenile fiction|juvenile literature|children's (fiction|stories|books)|picture books( for children)?|board books|stories in rhyme|english language|large type books|accessible book|protected daisy|in library|toy and movable books|lift-the-flap books|readers)$/i;

/** Edition-independent key for a title; suggestions and saved books are matched on it. */
export const titleKey = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
const norm = titleKey;

function useful(subject: string): boolean {
  return subject.length < 40 && !/[:=]/.test(subject) && !GENERIC.test(subject.trim());
}

async function search(params: string): Promise<any[]> {
  const url = `https://openlibrary.org/search.json?${params}&language=eng&limit=25&fields=key,title,author_name,isbn,cover_i,subject`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) });
    if (!res.ok) return [];
    const json = await res.json();
    return json.docs ?? [];
  } catch {
    return [];
  }
}

const avgRating = (b: Book) => {
  const r = Object.values(b.ratings || {});
  return r.length ? r.reduce((s, x) => s + x.stars, 0) / r.length : 0;
};

/** The books recommendations are based on: favourites and 4–5 star books, most loved first. */
export function pickSeeds(books: Book[]): Book[] {
  const score = (b: Book) => (b.favourite ? 10 : 0) + avgRating(b) * 2 + Math.min(b.readCount, 20) / 5;
  const loved = books.filter((b) => b.favourite || avgRating(b) >= 4);
  return (loved.length ? loved : books).slice().sort((a, b) => score(b) - score(a)).slice(0, 6);
}

export async function recommend(owned: Book[], seeds: Book[], limit = 24): Promise<Rec[]> {
  // v2: English editions only (earlier results could hold French/Spanish covers).
  const cacheKey = "nb-recs2:" + seeds.map((s) => s.isbn).join(",") + ":" + owned.length + ":" + limit;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  const ownedTitles = new Set(owned.map((b) => norm(b.title)));
  const found = new Map<string, Rec>();

  const add = (docs: any[], weight: number, why: string) => {
    for (const d of docs) {
      // Records with no author are usually incomplete (and look it), so they aren't suggested.
      if (!d.title || !d.author_name?.length) continue;
      // Only translations (no English ISBN): the cover and shop links would be for a foreign edition.
      const edition = pickEdition(d.isbn);
      if (edition.isbn && !edition.english) continue;
      const key = norm(d.title);
      if (ownedTitles.has(key)) continue;
      const subjects: string[] = d.subject ?? [];
      if (!subjects.some((s) => KID.test(s))) continue;
      const existing = found.get(key);
      if (existing) {
        existing.score += weight;
        continue;
      }
      found.set(key, {
        key,
        isbn: edition.isbn,
        title: d.title,
        author: d.author_name[0],
        coverUrl: editionCover(edition, d.cover_i),
        ageBand: guessAge(guessFormat(null, null, subjects), subjects, null),
        why,
        // A cover makes a suggestion far easier to recognise, so those edge ahead.
        score: weight + (d.cover_i ? 1 : 0),
      });
    }
  };

  const jobs: Promise<void>[] = [];
  for (const seed of seeds.slice(0, 6)) {
    const author = seed.authors[0];
    if (author && !/various|anonymous/i.test(author)) {
      jobs.push(search(`author=${encodeURIComponent(author)}`).then((docs) => add(docs, 3, `Same author as ${seed.title}`)));
    }
    const illustrator = seed.illustrators?.[0];
    if (illustrator && illustrator !== author) {
      jobs.push(search(`author=${encodeURIComponent(illustrator)}`).then((docs) => add(docs, 2, `Same illustrator as ${seed.title}`)));
    }
    for (const s of seed.subjects.filter(useful).slice(0, 2)) {
      jobs.push(
        search(`subject=${encodeURIComponent(s.toLowerCase())}`).then((docs) => add(docs, 2, `Like ${seed.title}: ${s.toLowerCase()}`))
      );
    }
  }
  await Promise.allSettled(jobs);

  const recs = [...found.values()].sort((a, b) => b.score - a.score).slice(0, limit);
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(recs));
  } catch {}
  return recs;
}

export function shopLinks(r: { isbn: string | null; title: string; author: string }) {
  const q = r.isbn ?? `${r.title} ${r.author}`;
  const tag = process.env.NEXT_PUBLIC_AMAZON_TAG;
  return {
    amazon: `https://www.amazon.co.uk/s?k=${encodeURIComponent(q)}&i=stripbooks${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`,
    // UK sellers only (LH_PrefLoc=1), cheapest including postage first (_sop=15).
    ebay: `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_PrefLoc=1&_sop=15`,
  };
}
