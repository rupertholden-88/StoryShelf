"use client";

import Link from "next/link";
import { AffiliateNote } from "@/components/AffiliateNote";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Gate } from "@/components/Gate";
import { RecCard } from "@/components/RecCard";
import { toggleWishlist, useBooks, useWishlist, wishId } from "@/lib/books";
import { bandForMonths, bandIndex, childAgeMonths } from "@/lib/household";
import { pickSeeds, recommend } from "@/lib/recommend";
import type { Household, Rec } from "@/lib/types";

export default function ForYouPage() {
  return <Gate>{({ household }) => <ForYou household={household} />}</Gate>;
}

function ForYou({ household }: { household: Household }) {
  const { books, loading } = useBooks();
  const { ids: wished, items: saved } = useWishlist();
  const [recs, setRecs] = useState<Rec[] | null>(null);
  const [tab, setTab] = useState<"now" | "next">("now");
  const nowBand = bandForMonths(childAgeMonths(household));
  const seeds = useMemo(() => pickSeeds(books), [books]);

  useEffect(() => {
    if (loading) return;
    if (seeds.length === 0) { setRecs([]); return; }
    let live = true;
    setRecs(null);
    recommend(books, seeds, 60).then((r) => live && setRecs(r)).catch(() => live && setRecs([]));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, seeds.map((s) => s.isbn).join(",")]);

  const shown = useMemo(() => {
    if (!recs || !nowBand) return recs?.slice(0, 24) ?? null;
    const nowIdx = bandIndex(nowBand);
    // A bigger pool is fetched so each tab can show a full page.
    return recs.filter((r) => (tab === "now" ? bandIndex(r.ageBand) <= nowIdx + 1 : bandIndex(r.ageBand) > nowIdx + 1)).slice(0, 24);
  }, [recs, tab, nowBand]);

  return (
    <>
      <header className="lib-header">
        <div className="lib-title-row">
          <h1 className="lib-title">For you</h1>
          <Link href="/for-you/saved" className="saved-link">Saved{saved.length ? ` · ${saved.length}` : ""}</Link>
        </div>
        <p className="lib-sub tucked">
          {seeds.length ? `Picked from ${seeds.slice(0, 2).map((s) => s.title).join(" and ")}${seeds.length > 2 ? " and more" : ""}` : "Rate a few books to get suggestions"}
        </p>
        {nowBand && (
          <div className="segmented full" role="group" aria-label="Age range">
            <button type="button" aria-pressed={tab === "now"} onClick={() => setTab("now")}>Right for now</button>
            <button type="button" aria-pressed={tab === "next"} onClick={() => setTab("next")}>Growing into</button>
          </div>
        )}
      </header>

      <main className="rec-list">
        {shown === null ? (
          <p className="section-sub">Finding books you don't have yet…</p>
        ) : shown.length === 0 ? (
          <p className="section-sub">
            {books.length === 0 ? "Scan some books first, then suggestions will appear here." : "Nothing here yet. Rate or favourite more books to widen the search."}
          </p>
        ) : (
          shown.map((r) => (
            <RecCard key={r.key} rec={r} wished={wished.has(wishId(r))} onWish={(on) => toggleWishlist(r, on)} />
          ))
        )}
        <AffiliateNote />
      </main>

      <BottomNav active="foryou" />
    </>
  );
}
