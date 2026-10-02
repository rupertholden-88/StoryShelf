"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CoverArt } from "@/components/BookArt";
import { LOGO_SVG } from "@/components/logoSvg";
import { claimGift, giftId, unclaimGift, useGiftList, type GiftItem } from "@/lib/gifts";
import { shopLinks } from "@/lib/recommend";
import { AGE_BANDS } from "@/lib/types";

const NAME = "nb-gift-name";
const MINE = "nb-gift-mine";

/** What family see from a shared link. No sign-in: just the books, shop links and "I'm getting this". */
export default function GiftPage() {
  const { token } = useParams<{ token: string }>();
  const list = useGiftList(token);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME) ?? "");
      setMine(new Set(JSON.parse(localStorage.getItem(MINE) ?? "[]")));
    } catch {}
  }, []);

  const remember = (next: Set<string>, who?: string) => {
    setMine(next);
    try {
      localStorage.setItem(MINE, JSON.stringify([...next]));
      if (who) localStorage.setItem(NAME, who);
    } catch {}
  };

  if (list === null) return <div className="gate"><p className="gate-note">Opening the wishlist…</p></div>;
  if (list === "missing") {
    return (
      <div className="gate">
        <h1 className="gate-title">This wishlist isn't shared any more</h1>
        <p className="gate-note">Ask whoever sent it for a new link.</p>
      </div>
    );
  }

  const child = list.childName?.trim();
  const open = list.items.filter((i) => !list.claims[giftId(i)] || mine.has(giftId(i)));
  const taken = list.items.filter((i) => list.claims[giftId(i)] && !mine.has(giftId(i)));

  return (
    <div className="gift-page">
      <header className="gift-head">
        <div className="gift-logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <h1 className="lib-title">{child ? `${child}'s book wishlist` : "Book wishlist"}</h1>
        <p className="lib-sub">
          Books {child ?? "they"} would love that aren't on the shelf yet. If you buy one, tap <strong>I'm getting this</strong> so nobody else does.
        </p>
      </header>

      <main className="rec-list">
        {list.items.length === 0 ? (
          <p className="section-sub">The wishlist is empty at the moment. Check back soon.</p>
        ) : (
          <>
            {open.map((i) => (
              <GiftCard key={giftId(i)} item={i} token={token} claimedBy={list.claims[giftId(i)]?.name} mine={mine.has(giftId(i))}
                name={name}
                onClaim={(who) => remember(new Set(mine).add(giftId(i)), who)}
                onUnclaim={() => { const n = new Set(mine); n.delete(giftId(i)); remember(n); }} />
            ))}
            {taken.length > 0 && (
              <section className="wish-section" aria-labelledby="taken">
                <h2 id="taken" className="section-title">Someone's already getting these</h2>
                {taken.map((i) => (
                  <GiftCard key={giftId(i)} item={i} token={token} claimedBy={list.claims[giftId(i)]?.name} mine={false} name={name} onClaim={() => {}} onUnclaim={() => {}} />
                ))}
              </section>
            )}
          </>
        )}
        <p className="affiliate-note">Made with Story Shelf. Shop links go to Amazon UK and eBay UK.</p>
      </main>
    </div>
  );
}

function GiftCard({ item, token, claimedBy, mine, name, onClaim, onUnclaim }: {
  item: GiftItem; token: string; claimedBy?: string; mine: boolean; name: string;
  onClaim: (who: string) => void; onUnclaim: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const [who, setWho] = useState(name);
  const [problem, setProblem] = useState<string | null>(null);
  const links = shopLinks(item);
  const age = AGE_BANDS.find((b) => b.id === item.ageBand)?.label;
  const id = giftId(item);

  useEffect(() => setWho(name), [name]);

  const claim = async (e: FormEvent) => {
    e.preventDefault();
    if (!who.trim()) return;
    try {
      await claimGift(token, id, who);
      onClaim(who.trim());
      setAsking(false);
    } catch {
      setProblem("That didn't save. Check your connection and try again.");
    }
  };

  return (
    <article className={`rec-card${claimedBy && !mine ? " gift-taken" : ""}`}>
      <CoverArt book={{ isbn: item.isbn ?? item.key, title: item.title, authors: [item.author], coverUrl: item.coverUrl, favourite: false }} width={64} height={86} />
      <div className="rec-body">
        <h3 className="rec-title">{item.title}</h3>
        <p className="rec-author">{item.author}{age && <span className="rec-age">{age}</span>}</p>
        {claimedBy ? (
          <p className="claimed">🎁 {mine ? "You're getting this" : `${claimedBy} is getting this`}</p>
        ) : null}
        {!claimedBy || mine ? (
          <div className="rec-actions">
            <a className="shop-btn" href={links.amazon} target="_blank" rel="noopener noreferrer"><span className="shop-name">Amazon</span></a>
            <a className="shop-btn" href={links.ebay} target="_blank" rel="noopener noreferrer"><span className="shop-name">eBay</span></a>
            {mine ? (
              <button type="button" className="text-btn" onClick={() => unclaimGift(token, id).then(onUnclaim).catch(() => setProblem("That didn't save. Try again."))}>
                Not any more
              </button>
            ) : !asking ? (
              <button type="button" className="btn btn-small btn-dark" onClick={() => setAsking(true)}>I'm getting this</button>
            ) : null}
          </div>
        ) : null}
        {asking && !claimedBy && (
          <form className="gift-claim" onSubmit={claim}>
            <label htmlFor={`who-${id}`} className="field-label">Your name, so the family know</label>
            <div className="btn-row">
              <input id={`who-${id}`} className="field" maxLength={40} autoComplete="name" placeholder="e.g. Grandma" value={who} onChange={(e) => setWho(e.target.value)} autoFocus />
              <button type="submit" className="btn btn-small btn-dark" disabled={!who.trim()}>Save</button>
            </div>
          </form>
        )}
        {problem && <p className="form-error" role="alert">{problem}</p>}
      </div>
    </article>
  );
}
