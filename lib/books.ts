"use client";

import { useEffect, useState } from "react";
import {
  collection, deleteDoc, doc, FieldPath, getDoc, increment, onSnapshot,
  serverTimestamp, setDoc, updateDoc,
} from "firebase/firestore";
import { db, HOUSEHOLD_ID } from "./firebase";
import type { Book, Rec } from "./types";

const booksCol = () => collection(db(), "households", HOUSEHOLD_ID, "books");
const bookRef = (isbn: string) => doc(db(), "households", HOUSEHOLD_ID, "books", isbn);
const wishCol = () => collection(db(), "households", HOUSEHOLD_ID, "wishlist");
const wishRef = (id: string) => doc(db(), "households", HOUSEHOLD_ID, "wishlist", id);

function withDefaults(data: Partial<Book>, isbn: string): Book {
  return {
    isbn,
    title: data.title ?? "Untitled",
    authors: data.authors ?? [],
    coverUrl: data.coverUrl ?? null,
    subjects: data.subjects ?? [],
    theme: data.theme ?? "Stories",
    ageBand: data.ageBand ?? "3-5",
    format: data.format ?? "picture",
    pages: data.pages ?? null,
    favourite: data.favourite ?? false,
    readCount: data.readCount ?? 0,
    ratings: data.ratings ?? {},
    addedAt: data.addedAt ?? null,
    addedBy: data.addedBy,
    lookedUpAt: data.lookedUpAt,
  };
}

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(
    () =>
      onSnapshot(booksCol(), (snap) => {
        setBooks(snap.docs.map((d) => withDefaults(d.data() as Partial<Book>, d.id)));
        setLoading(false);
      }),
    []
  );
  return { books, loading };
}

export function useBook(isbn: string) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(
    () =>
      onSnapshot(bookRef(isbn), (snap) => {
        setBook(snap.exists() ? withDefaults(snap.data() as Partial<Book>, snap.id) : null);
        setLoading(false);
      }),
    [isbn]
  );
  return { book, loading };
}

export async function getBook(isbn: string): Promise<Book | null> {
  const snap = await getDoc(bookRef(isbn));
  return snap.exists() ? withDefaults(snap.data() as Partial<Book>, snap.id) : null;
}

export type NewBook = Omit<Book, "favourite" | "readCount" | "ratings" | "addedAt" | "addedBy">;

export async function addBook(b: NewBook, addedBy: string) {
  await setDoc(bookRef(b.isbn), {
    ...b,
    favourite: false,
    readCount: 0,
    ratings: {},
    addedAt: serverTimestamp(),
    addedBy,
  });
  await deleteDoc(wishRef(b.isbn)).catch(() => {});
}

export const updateBook = (isbn: string, patch: Partial<Book>) => updateDoc(bookRef(isbn), patch);
export const rateBook = (isbn: string, uid: string, name: string, stars: number) =>
  updateDoc(bookRef(isbn), new FieldPath("ratings", uid), { name, stars });
export const readAgain = (isbn: string) => updateDoc(bookRef(isbn), { readCount: increment(1) });
export const removeBook = (isbn: string) => deleteDoc(bookRef(isbn));

export function useWishlist() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => onSnapshot(wishCol(), (snap) => setIds(new Set(snap.docs.map((d) => d.id)))), []);
  return ids;
}

export const wishId = (r: Rec) => r.isbn ?? r.key;

export async function toggleWishlist(r: Rec, on: boolean) {
  if (on) {
    await setDoc(wishRef(wishId(r)), { ...r, addedAt: serverTimestamp() });
  } else {
    await deleteDoc(wishRef(wishId(r)));
  }
}
