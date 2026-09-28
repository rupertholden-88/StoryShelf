"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A text field that saves when you leave it, and shows changes made on another phone
 * whenever you aren't typing in it.
 */
export function SyncedField({ id, value, onSave, required = false }: {
  id: string; value: string; onSave: (text: string) => void; required?: boolean;
}) {
  const [text, setText] = useState(value);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(value);
  }, [value]);

  return (
    <input
      id={id}
      className="field"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => { focused.current = true; }}
      onBlur={() => {
        focused.current = false;
        const t = text.trim();
        if ((required && !t) || t === value.trim()) setText(value);
        else onSave(t);
      }}
    />
  );
}
