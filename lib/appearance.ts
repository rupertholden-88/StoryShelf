import type { Book } from "./types";

// Spine colours for books; the real cover image is used in covers view when one exists.
const PALETTE: [string, string][] = [
  ["#E2A72E", "#2A2118"], ["#2F5DA8", "#F7F1E3"], ["#C8413A", "#F7F1E3"], ["#1F7A74", "#F7F1E3"],
  ["#5E3A6B", "#F7F1E3"], ["#9CC3E0", "#2A2118"], ["#6F7D33", "#F7F1E3"], ["#E596AB", "#2A2118"],
  ["#EFE3C8", "#2A2118"], ["#1E2C4F", "#F7F1E3"], ["#2F5B3A", "#F7F1E3"],
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function bookColours(key: string): { bg: string; fg: string } {
  const [bg, fg] = PALETTE[hash(key) % PALETTE.length];
  return { bg, fg };
}

export function spineSize(b: Pick<Book, "isbn" | "format">): { w: number; h: number } {
  const h = hash(b.isbn);
  if (b.format === "board") return { w: 30 + ((h >> 4) % 6), h: 96 + ((h >> 8) % 14) };
  return { w: 20 + ((h >> 4) % 7), h: 118 + ((h >> 8) % 28) };
}

export function surname(b: Pick<Book, "authors">): string {
  const parts = (b.authors[0] || "").trim().split(/\s+/);
  return parts[parts.length - 1] || "";
}

/** Library-style call number: first three letters of the author's surname, or "" when there's no author. */
export function callNumber(b: Pick<Book, "authors">): string {
  return surname(b).replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}
