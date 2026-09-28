/** Checksum for any 13-digit EAN barcode (ISBNs are EANs starting 978/979). */
export function ean13Valid(s: string): boolean {
  return /^\d{13}$/.test(s) && isbn13Valid(s);
}

function isbn13Valid(s: string): boolean {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(s[i]) * (i % 2 ? 3 : 1);
  return (10 - (sum % 10)) % 10 === Number(s[12]);
}

function isbn10Valid(s: string): boolean {
  if (!/^\d{9}[\dX]$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += (s[i] === "X" ? 10 : Number(s[i])) * (10 - i);
  return sum % 11 === 0;
}

function isbn10to13(s: string): string {
  const base = "978" + s.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(base[i]) * (i % 2 ? 3 : 1);
  return base + ((10 - (sum % 10)) % 10);
}

/** Returns a valid ISBN-13, or null if the input isn't a book barcode/ISBN. */
export function cleanIsbn(raw: string): string | null {
  const s = raw.replace(/[^0-9Xx]/g, "").toUpperCase();
  if (s.length === 13 && /^97[89]\d{10}$/.test(s) && isbn13Valid(s)) return s;
  if (s.length === 10 && isbn10Valid(s)) return isbn10to13(s);
  return null;
}

/** English-language registration groups: 978-0 and 978-1 (UK, US, Australia…) and 979-8 (US). */
export const isEnglishIsbn = (isbn13: string) => /^(978[01]|9798)/.test(isbn13);

/**
 * The edition to use for a book found on Open Library: an English-language ISBN if there is one,
 * since a work's ISBN list mixes in translations (French, Spanish…) in no particular order.
 */
export function pickEdition(list: string[] | undefined): { isbn: string | null; english: boolean } {
  let first: string | null = null;
  for (const raw of list ?? []) {
    const c = cleanIsbn(raw);
    if (!c) continue;
    if (isEnglishIsbn(c)) return { isbn: c, english: true };
    first ??= c;
  }
  return { isbn: first, english: false };
}

/**
 * Cover for a book found on Open Library. With an English edition, its cover is found from the ISBN
 * (see coverCandidates), because the work's own cover is often a translation's.
 */
export function editionCover(edition: { english: boolean }, coverId: number | undefined): string | null {
  if (edition.english || !coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

/** ISBN-10 for a 978 ISBN-13 (979 has no ISBN-10 form). */
export function isbn13to10(isbn13: string): string | null {
  if (!/^978\d{10}$/.test(isbn13)) return null;
  const core = isbn13.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(core[i]) * (10 - i);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? "X" : String(check));
}

/** Cover images to try in order: the saved one, Open Library by ISBN, then Amazon's image by ISBN-10. */
export function coverCandidates(isbn: string, saved: string | null): string[] {
  const list: string[] = [];
  if (saved) list.push(saved);
  if (/^97[89]\d{10}$/.test(isbn)) {
    list.push(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`);
    const ten = isbn13to10(isbn);
    if (ten) list.push(`https://images-na.ssl-images-amazon.com/images/P/${ten}.01.L.jpg`);
  }
  return [...new Set(list)];
}
