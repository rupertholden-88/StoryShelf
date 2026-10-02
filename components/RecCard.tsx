"use client";

import { useEffect, useState, type ReactNode } from "react";
import { firebaseAuth, householdId } from "@/lib/firebase";
import { shopLinks } from "@/lib/recommend";
import { AGE_BANDS, type Rec } from "@/lib/types";
import { CoverArt } from "./BookArt";
import { BookmarkIcon } from "./Icons";

type EbayResult = { lowest?: { value: string; currency: string }; url?: string; count?: number };

const money = (v: string, c: string) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: c || "GBP" }).format(Number(v));

export function RecCard({ rec, wished, onWish, note }: { rec: Rec; wished: boolean; onWish: (on: boolean) => void; note?: ReactNode }) {
  const links = shopLinks(rec);
  const [ebay, setEbay] = useState<EbayResult | null>(null);

  useEffect(() => {
    let live = true;
    const params = new URLSearchParams({ q: `${rec.title} ${rec.author}` });
    if (rec.isbn) params.set("isbn", rec.isbn);
    (async () => {
      const token = await firebaseAuth().currentUser?.getIdToken();
      if (!token) return null;
      const r = await fetch(`/api/ebay?${params}`, { headers: { Authorization: `Bearer ${token}`, "X-Household": householdId() } });
      return r.ok ? r.json() : null;
    })()
      .then((j) => live && setEbay(j))
      .catch(() => {});
    return () => { live = false; };
  }, [rec.isbn, rec.title, rec.author]);

  const age = AGE_BANDS.find((b) => b.id === rec.ageBand)?.label;

  return (
    <article className="rec-card">
      <CoverArt book={{ isbn: rec.isbn ?? rec.key, title: rec.title, authors: [rec.author], coverUrl: rec.coverUrl, favourite: false }} width={64} height={86} />
      <div className="rec-body">
        <h2 className="rec-title">{rec.title}</h2>
        <p className="rec-author">{rec.author}{age && <span className="rec-age">{age}</span>}</p>
        <p className="rec-why">{rec.why}</p>
        {note}
        <div className="rec-actions">
          <a className="shop-btn" href={links.amazon} target="_blank" rel="noopener noreferrer">
            <span className="shop-name">Amazon UK</span>
            <span className="shop-price">Check price</span>
          </a>
          <a className="shop-btn" href={ebay?.url ?? links.ebay} target="_blank" rel="noopener noreferrer">
            <span className="shop-name">eBay UK</span>
            <span className="shop-price">
              {ebay?.lowest ? `${money(ebay.lowest.value, ebay.lowest.currency)} delivered` : "See listings"}
            </span>
          </a>
          <button
            type="button"
            className="icon-btn wish-btn"
            aria-label={wished ? `Remove ${rec.title} from wishlist` : `Add ${rec.title} to wishlist`}
            aria-pressed={wished}
            onClick={() => onWish(!wished)}
          >
            <BookmarkIcon filled={wished} />
          </button>
        </div>
      </div>
    </article>
  );
}
