"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { LOGO_SVG } from "./logoSvg";

const SEEN = "nb-splash";
const DAY = "nb-splash-day";
const MIN_MS = 3000;
/** Later launches the same day, and reduced motion: the finished logo, briefly. */
const MIN_MS_QUICK = 900;
const FADE_MS = 500;

/**
 * The Story Shelf logo drawing itself while the app signs in: the frame traces round, the books
 * pop up onto the shelf, the bird hops on and waves its wand, then the title glows in.
 * Server-rendered so it shows before any JavaScript runs. The full animation plays once a day;
 * later launches show the finished logo briefly. It stays until sign-in has settled.
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
    // The layout's head script has already marked a repeat launch today as "quick" before first paint.
    const quick = document.documentElement.dataset.splash === "quick"
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      localStorage.setItem(DAY, new Date().toDateString());
    } catch {}
    const t = setTimeout(() => setMinDone(true), quick ? MIN_MS_QUICK : MIN_MS);
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
      <div className="splash-logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
    </div>
  );
}
