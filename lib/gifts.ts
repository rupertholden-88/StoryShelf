"use client";

import { useEffect, useState } from "react";
import {
  collection, deleteDoc, deleteField, doc, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { db, householdId } from "./firebase";
import type { AgeBand } from "./types";

/**
 * The family wishlist: a copy of the saved books at giftLists/{token}, readable by anyone with the
 * link (no account), so relatives can see what to buy and mark "I'm getting this".
 */
export type GiftItem = { key: string; isbn: string | null; title: string; author: string; coverUrl: string | null; ageBand: AgeBand };
export type Claim = { name: string; at?: Timestamp | null };
export type GiftList = { household: string; childName?: string; items: GiftItem[]; claims: Record<string, Claim> };
const claimsCol = (token: string) => collection(db(), "giftLists", token, "claims");

const giftRef = (token: string) => doc(db(), "giftLists", token);
export const giftId = (i: { isbn: string | null; key: string }) => i.isbn ?? i.key;

// Set from the household document, so wishlist changes can be copied to the shared list.
let sharing: { token: string; childName?: string } | null = null;
export function setSharing(s: { token?: string; childName?: string } | null) {
  const renamed = !!sharing && !!s?.token && sharing.token === s.token && sharing.childName !== s.childName;
  sharing = s?.token ? { token: s.token, childName: s.childName } : null;
  if (renamed) syncGiftList().catch(() => {});
}

/** Copies the saved books to the shared list. Called after every wishlist change and when sharing starts. */
export async function syncGiftList() {
  if (!sharing) return;
  const snap = await getDocs(collection(db(), "households", householdId(), "wishlist"));
  const items = snap.docs
    .map((d) => d.data() as GiftItem & { addedAt?: Timestamp | null })
    .sort((a, b) => (b.addedAt?.toMillis() ?? Infinity) - (a.addedAt?.toMillis() ?? Infinity))
    .slice(0, 100)
    .map(({ key, isbn, title, author, coverUrl, ageBand }) => ({ key, isbn, title, author, coverUrl, ageBand }));
  await setDoc(giftRef(sharing.token), { childName: sharing.childName ?? "", items, updatedAt: serverTimestamp() }, { merge: true });
}

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Turns on sharing: a new secret link, filled with the current wishlist. */
export async function startSharing(childName?: string): Promise<string> {
  const token = newToken();
  const hid = householdId();
  // The household records the token first, so only this library's members can create its list.
  await updateDoc(doc(db(), "households", hid), { giftToken: token });
  await setDoc(giftRef(token), { household: hid, childName: childName ?? "", items: [], updatedAt: serverTimestamp() });
  sharing = { token, childName };
  await syncGiftList();
  return token;
}

/** Turns sharing off; the old link stops working. */
export async function stopSharing(token: string) {
  const claims = await getDocs(claimsCol(token)).catch(() => null);
  await Promise.all(claims?.docs.map((d) => deleteDoc(d.ref)) ?? []);
  await deleteDoc(giftRef(token)).catch(() => {});
  await updateDoc(doc(db(), "households", householdId()), { giftToken: deleteField() });
  sharing = null;
}

export const giftUrl = (token: string) => `${window.location.origin}/gifts/${token}`;

/** Follows a shared list and its claims (works signed out). null while loading; "missing" if the link is off. */
export function useGiftList(token: string | undefined) {
  const [list, setList] = useState<Omit<GiftList, "claims"> | "missing" | null>(null);
  const [claims, setClaims] = useState<Record<string, Claim>>({});
  useEffect(() => {
    if (!token) return;
    const stopList = onSnapshot(
      giftRef(token),
      (snap) => setList(snap.exists() ? ({ items: [], ...snap.data() } as unknown as GiftList) : "missing"),
      () => setList("missing")
    );
    const stopClaims = onSnapshot(
      claimsCol(token),
      (snap) => setClaims(Object.fromEntries(snap.docs.map((d) => [d.id, d.data() as Claim]))),
      () => {}
    );
    return () => { stopList(); stopClaims(); };
  }, [token]);
  if (list === null || list === "missing") return list;
  return { ...list, claims } as GiftList;
}

export const claimGift = (token: string, key: string, name: string) =>
  setDoc(doc(claimsCol(token), key), { name: name.trim().slice(0, 40), at: serverTimestamp() });
export const unclaimGift = (token: string, key: string) => deleteDoc(doc(claimsCol(token), key));
