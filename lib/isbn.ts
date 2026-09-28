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

export function pickIsbn(list: string[] | undefined): string | null {
  if (!list) return null;
  for (const raw of list) {
    const c = cleanIsbn(raw);
    if (c) return c;
  }
  return null;
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
