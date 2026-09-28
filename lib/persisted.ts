"use client";

import { useEffect, useState } from "react";

/** useState that remembers its value on this device. Reads after mount to avoid hydration mismatches. */
export function usePersisted<T extends string>(key: string, initial: T, allowed: readonly T[]) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const v = localStorage.getItem(key) as T | null;
      if (v && allowed.includes(v)) setValue(v);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: T) => {
    setValue(v);
    try {
      localStorage.setItem(key, v);
    } catch {}
  };
  return [value, set] as const;
}
