"use client";

import { useEffect, useState } from "react";
import {
  addDoc, arrayRemove, arrayUnion, collection, doc, limit, onSnapshot, query, serverTimestamp, updateDoc, where,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db, setHouseholdId } from "./firebase";
import { setSharing } from "./gifts";
import { AGE_BANDS, type AgeBand, type Household } from "./types";

/** "none": signed in but not in any library yet, so they can start one. */
export type HouseholdStatus = "loading" | "ok" | "none" | "error";

/** The library from before libraries were found by email (households/holden). */
const LEGACY_HOUSEHOLD = "holden";

export const normEmail = (e: string) => e.trim().toLowerCase();
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/** Finds the library whose members list includes this email, and follows changes to it. */
export function useHousehold(email: string | null) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [status, setStatus] = useState<HouseholdStatus>("loading");

  useEffect(() => {
    if (!email) return;
    setStatus("loading");
    const found = (d: DocumentSnapshot | undefined) => {
      if (!d?.exists()) {
        setHouseholdId(null);
        setSharing(null);
        setHousehold(null);
        setStatus("none");
        return;
      }
      const data = d.data() as Omit<Household, "id">;
      setHouseholdId(d.id);
      setSharing({ token: data.giftToken, childName: data.childName });
      setHousehold({ ...data, id: d.id });
      setStatus("ok");
    };
    let stopLegacy: (() => void) | undefined;
    const q = query(collection(db(), "households"), where("members", "array-contains", email), limit(1));
    const stop = onSnapshot(
      q,
      (snap) => found(snap.docs[0]),
      // Older firestore.rules don't allow finding a library by email; open the original library directly
      // until the new rules are published.
      () => {
        stopLegacy = onSnapshot(doc(db(), "households", LEGACY_HOUSEHOLD), found, () => setStatus("error"));
      }
    );
    return () => { stop(); stopLegacy?.(); };
  }, [email]);

  return { household, status };
}

/** Starts a new library with the signed-in person as its only member. */
export function createHousehold(email: string, details: { childName?: string; childBirthMonth?: string }) {
  const data: Record<string, unknown> = { members: [email], createdAt: serverTimestamp() };
  if (details.childName?.trim()) data.childName = details.childName.trim();
  if (details.childBirthMonth) data.childBirthMonth = details.childBirthMonth;
  return addDoc(collection(db(), "households"), data);
}

const householdRef = (id: string) => doc(db(), "households", id);

export const updateChild = (id: string, childName: string, childBirthMonth: string) =>
  updateDoc(householdRef(id), { childName: childName.trim(), childBirthMonth });
export const addMember = (id: string, email: string) => updateDoc(householdRef(id), { members: arrayUnion(normEmail(email)) });
export const removeMember = (id: string, email: string) => updateDoc(householdRef(id), { members: arrayRemove(email) });

export function childAgeMonths(h: Household | null): number | null {
  if (!h?.childBirthMonth) return null;
  const [y, m] = h.childBirthMonth.split("-").map(Number);
  if (!y || !m) return null;
  const now = new Date();
  return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
}

export function bandForMonths(months: number | null): AgeBand | null {
  if (months === null) return null;
  let band: AgeBand = AGE_BANDS[0].id;
  for (const b of AGE_BANDS) if (months >= b.fromMonths) band = b.id;
  return band;
}

export function bandIndex(band: AgeBand): number {
  return AGE_BANDS.findIndex((b) => b.id === band);
}
