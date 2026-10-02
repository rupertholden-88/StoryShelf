"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AffiliateNote } from "@/components/AffiliateNote";
import { BottomNav } from "@/components/BottomNav";
import { Gate } from "@/components/Gate";
import { HitCard } from "@/components/HitCard";
import { BackIcon } from "@/components/Icons";
import { RecCard } from "@/components/RecCard";
import { toggleWishlist, useBooks, useWishlist, wishId } from "@/lib/books";
import { giftUrl, startSharing, stopSharing, syncGiftList, useGiftList } from "@/lib/gifts";
import { bandForMonths, bandIndex, childAgeMonths } from "@/lib/household";
import { pickSeeds, recommend } from "@/lib/recommend";
import type { Household, Rec } from "@/lib/types";

export default function WishlistPage() {
  return <Gate>{({ household }) => <Wishlist household={household} />}</Gate>;
}

const IDEAS = 8;

function Wishlist({ household }: { household: Household }) {
  const { items, ids, loading } = useWishlist();
  const { books, loading: booksLoading } = useBooks();
  const child = household.childName || "your child";
  const list = useGiftList(household.giftToken);
  const claims = list && list !== "missing" ? list.claims : {};

  // Make sure the shared copy matches, in case the wishlist changed on a phone that was offline.
  useEffect(() => { if (household.giftToken) syncGiftList().catch(() => {}); }, [household.giftToken]);

  return (
    <>
      <header className="lib-header">
        <Link href="/for-you" className="text-btn light back-link"><BackIcon />For you</Link>
        <h1 className="lib-title">Wishlist</h1>
        <p className="lib-sub tucked">Books for family to buy {household.childName ? `for ${household.childName}` : ""}. They come off once you scan them.</p>
      </header>

      <main className="rec-list wishlist">
        <ShareCard household={household} count={items.length} />

        <section aria-labelledby="wanted" className="wish-section">
          <h2 id="wanted" className="section-title">On the wishlist</h2>
          {loading ? (
            <p className="section-sub">Opening the list…</p>
          ) : items.length === 0 ? (
            <p className="section-sub">Nothing yet. Add some of the ideas below, or tap the bookmark on any suggestion or search result.</p>
          ) : (
            items.map((r) => {
              const claim = claims[wishId(r)];
              return (
                <RecCard key={wishId(r)} rec={r} wished onWish={(on) => toggleWishlist(r, on)}
                  note={claim && <p className="claimed">🎁 {claim.name} is getting this</p>} />
              );
            })
          )}
        </section>

        <Ideas household={household} books={books} booksLoading={booksLoading} wished={ids} child={child} />
        <AffiliateNote />
      </main>

      <BottomNav active="foryou" />
    </>
  );
}

/** Suggestions for the child's age that aren't on the wishlist yet, to add in one tap. */
function Ideas({ household, books, booksLoading, wished, child }: {
  household: Household; books: ReturnType<typeof useBooks>["books"]; booksLoading: boolean; wished: Set<string>; child: string;
}) {
  const [recs, setRecs] = useState<Rec[] | null>(null);
  const seeds = useMemo(() => pickSeeds(books), [books]);
  const nowBand = bandForMonths(childAgeMonths(household));

  useEffect(() => {
    if (booksLoading) return;
    if (!seeds.length) { setRecs([]); return; }
    let live = true;
    recommend(books, seeds, 60).then((r) => live && setRecs(r)).catch(() => live && setRecs([]));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booksLoading, seeds.map((s) => s.isbn).join(",")]);

  const ideas = useMemo(() => {
    if (!recs) return null;
    const fits = (r: Rec) => !nowBand || Math.abs(bandIndex(r.ageBand) - bandIndex(nowBand)) <= 1;
    return recs.filter((r) => !wished.has(wishId(r)) && fits(r)).slice(0, IDEAS);
  }, [recs, wished, nowBand]);

  return (
    <section aria-labelledby="ideas" className="wish-section">
      <h2 id="ideas" className="section-title">Ideas {child} might like</h2>
      <p className="section-sub">Picked from the books {child} loves, for about their age. Tap the bookmark to add one.</p>
      {ideas === null ? (
        <p className="section-sub">Finding ideas…</p>
      ) : ideas.length === 0 ? (
        <p className="section-sub">{books.length ? "No new ideas right now. Rate or favourite a few more books." : "Scan some books first and ideas will appear here."}</p>
      ) : (
        ideas.map((r) => <HitCard key={r.key} rec={r} wished={false} showWhy />)
      )}
    </section>
  );
}

function ShareCard({ household, count }: { household: Household; count: number }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const token = household.giftToken;
  const child = household.childName;

  const start = async () => {
    setBusy(true);
    setProblem(null);
    try { await startSharing(child); } catch { setProblem("Couldn't create the link. Check your connection and try again."); }
    setBusy(false);
  };
  const stop = async () => {
    if (!token || !confirm("Stop sharing? The link you sent will stop working.")) return;
    setBusy(true);
    await stopSharing(token).catch(() => setProblem("Couldn't stop sharing. Try again."));
    setBusy(false);
  };
  const share = async () => {
    if (!token) return;
    const url = giftUrl(token);
    const text = `${child ? `${child}'s` : "Our"} book wishlist. Tap "I'm getting this" on anything you buy so we don't get it twice.`;
    if (navigator.share) {
      try { await navigator.share({ title: "Book wishlist", text, url }); } catch {}
      return;
    }
    await navigator.clipboard?.writeText(`${text} ${url}`).then(() => setCopied(true)).catch(() => {});
  };

  return (
    <section className="settings-card share-card" aria-labelledby="share">
      <h2 id="share" className="section-title">Share with family</h2>
      {token ? (
        <>
          <p className="section-sub">
            Anyone with the link can see this list and mark what they're buying. No account needed. Books you already own are never on it.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn-dark btn-small" onClick={share} disabled={busy}>{copied ? "Link copied" : "Send the link"}</button>
            <a className="btn btn-outline btn-small" href={giftUrl(token)} target="_blank" rel="noopener noreferrer">See what they see</a>
          </div>
          <button type="button" className="text-btn" onClick={stop} disabled={busy}>Stop sharing</button>
        </>
      ) : (
        <>
          <p className="section-sub">
            Make a link for grandparents and friends. They'll see {count ? `these ${count} books` : "the list"}, with shop links, and can mark what they're getting.
          </p>
          <button type="button" className="btn btn-dark" onClick={start} disabled={busy}>{busy ? "Making the link…" : "Make a family link"}</button>
        </>
      )}
      {problem && <p className="form-error" role="alert">{problem}</p>}
    </section>
  );
}
