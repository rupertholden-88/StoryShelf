import type { Timestamp } from "firebase/firestore";

export type AgeBand = "0-1" | "1-2" | "2-3" | "3-5" | "5+";
export type Format = "board" | "picture" | "other";

export const AGE_BANDS: { id: AgeBand; label: string; fromMonths: number }[] = [
  { id: "0-1", label: "0–1 years", fromMonths: 0 },
  { id: "1-2", label: "1–2 years", fromMonths: 12 },
  { id: "2-3", label: "2–3 years", fromMonths: 24 },
  { id: "3-5", label: "3–5 years", fromMonths: 36 },
  { id: "5+", label: "5+ years", fromMonths: 60 },
];

export const THEMES = [
  "Animals",
  "Bedtime",
  "Rhymes & songs",
  "First words",
  "Vehicles",
  "Family & feelings",
  "Stories",
] as const;

/** Where a book is. Only "shelf" books are on the bookcase; the rest still count as owned. */
export type Status = "shelf" | "away" | "lent" | "gone";
export const STATUSES: { id: Status; label: string; plural: string }[] = [
  { id: "shelf", label: "On the shelf", plural: "On the shelf" },
  { id: "away", label: "Put away", plural: "Put away" },
  { id: "lent", label: "Lent out", plural: "Lent out" },
  { id: "gone", label: "Passed on", plural: "Passed on" },
];

export interface Rating {
  name: string;
  stars: number;
}

export interface Book {
  isbn: string;
  title: string;
  authors: string[];
  illustrators: string[];
  coverUrl: string | null;
  subjects: string[];
  theme: string;
  ageBand: AgeBand;
  format: Format;
  pages: number | null;
  favourite: boolean;
  readCount: number;
  ratings: Record<string, Rating>;
  status: Status;
  /** Who has it, when lent out. */
  lentTo?: string;
  addedAt?: Timestamp | null;
  addedBy?: string;
  /** When missing details were last looked up automatically (ms). */
  lookedUpAt?: number;
  /** Version of the lookup that last ran, so improvements re-check older books once. */
  lookedUpV?: number;
}

export interface Household {
  /** Firestore document id under /households. */
  id: string;
  /** Email addresses of the people who share the library. */
  members: string[];
  childName?: string;
  /** "YYYY-MM" */
  childBirthMonth?: string;
  /** Secret id of the shared gift list, when sharing is on. */
  giftToken?: string;
}

export interface Rec {
  key: string;
  isbn: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
  ageBand: AgeBand;
  why: string;
  score: number;
}
