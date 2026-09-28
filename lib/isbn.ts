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
