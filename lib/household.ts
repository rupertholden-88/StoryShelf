"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, HOUSEHOLD_ID } from "./firebase";
import { AGE_BANDS, type AgeBand, type Household } from "./types";

export type HouseholdStatus = "loading" | "ok" | "denied";

export function useHousehold(enabled: boolean) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [status, setStatus] = useState<HouseholdStatus>("loading");

  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(
      doc(db(), "households", HOUSEHOLD_ID),
      (snap) => {
        if (!snap.exists()) {
          setStatus("denied");
          return;
        }
        setHousehold(snap.data() as Household);
        setStatus("ok");
      },
      () => setStatus("denied")
    );
  }, [enabled]);

  return { household, status };
}

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
