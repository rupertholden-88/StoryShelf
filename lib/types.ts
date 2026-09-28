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

export interface Rating {
  name: string;
  stars: number;
}

export interface Book {
  isbn: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  subjects: string[];
  theme: string;
  ageBand: AgeBand;
  format: Format;
  pages: number | null;
  favourite: boolean;
  readCount: number;
  ratings: Record<string, Rating>;
  addedAt?: Timestamp | null;
  addedBy?: string;
  /** When missing details were last looked up automatically (ms). */
  lookedUpAt?: number;
}

export interface Household {
  members: string[];
  childName?: string;
  /** "YYYY-MM" */
  childBirthMonth?: string;
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
