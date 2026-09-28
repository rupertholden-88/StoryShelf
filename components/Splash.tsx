"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

const SEEN = "nb-splash";
const MIN_MS = 2600;
const MIN_MS_REDUCED = 700;
const FADE_MS = 500;

/**
 * A storybook opening on a shelf plank while the app signs in. Server-rendered so it shows
 * before any JavaScript runs; plays once per session and stays until sign-in has settled.
 */
export function Splash() {
  const { loading } = useAuth();
  const [minDone, setMinDone] = useState(false);
  const [phase, setPhase] = useState<"show" | "leaving" | "gone">("show");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN) === "1";
      sessionStorage.setItem(SEEN, "1");
    } catch {}
    if (seen) {
      setPhase("gone");
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setMinDone(true), reduced ? MIN_MS_REDUCED : MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === "show" && minDone && !loading) setPhase("leaving");
  }, [phase, minDone, loading]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const t = setTimeout(() => setPhase("gone"), FADE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div className={`splash${phase === "leaving" ? " leaving" : ""}`} aria-hidden="true">
      <div className="splash-scene">
        <div className="splash-sparks">
          {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={`spark s${i}`}>✦</span>)}
        </div>
        <div className="splash-book">
          <div className="sb-page" />
          <div className="sb-cover">
            <div className="sb-cover-front"><span className="sb-cover-title" /><span className="sb-cover-star">✦</span></div>
            <div className="sb-cover-back" />
          </div>
          <div className="sb-leaf l1" />
          <div className="sb-leaf l2" />
          <div className="sb-leaf l3" />
        </div>
        <div className="splash-plank" />
      </div>
      <p className="splash-once">Once upon a time…</p>
      <p className="splash-title">Story Shelf</p>
    </div>
  );
}
