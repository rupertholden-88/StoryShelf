"use client";

import Link from "next/link";
import { toggleWishlist } from "@/lib/books";
import { shopLinks } from "@/lib/recommend";
import { AGE_BANDS, type Rec } from "@/lib/types";
import { CoverArt } from "./BookArt";
import { BookmarkIcon } from "./Icons";

/** A book that isn't on the shelves yet: add it without scanning, find it in a shop, or save it for later. */
export function HitCard({ rec, wished, year, showAge = true, showWhy = false }: {
  rec: Rec; wished: boolean; year?: number | null; showAge?: boolean; showWhy?: boolean;
}) {
  const links = shopLinks(rec);
  const age = showAge ? AGE_BANDS.find((b) => b.id === rec.ageBand)?.label : null;
  const meta = [year, age].filter(Boolean).join(" · ");
  // Only the fields a saved book keeps (see firestore.rules).
  const { key, isbn, title, author, coverUrl, ageBand, why, score } = rec;
  return (
    <article className="rec-card">
      <CoverArt book={{ isbn: rec.isbn ?? rec.key, title: rec.title, authors: [rec.author], coverUrl: rec.coverUrl, favourite: false }} width={64} height={86} />
      <div className="rec-body">
        <h3 className="rec-title">{rec.title}</h3>
        <p className="rec-author">{rec.author}{meta && <span className="rec-age">{meta}</span>}</p>
        {showWhy && <p className="rec-why">{rec.why}</p>}
        <div className="rec-actions">
          {rec.isbn && <Link className="btn btn-small btn-dark" href={`/scan?isbn=${rec.isbn}`}>Add to shelf</Link>}
          <a className="shop-btn" href={links.amazon} target="_blank" rel="noopener noreferrer"><span className="shop-name">Amazon</span></a>
          <a className="shop-btn" href={links.ebay} target="_blank" rel="noopener noreferrer"><span className="shop-name">eBay</span></a>
          <button
            type="button"
            className="icon-btn wish-btn"
            aria-label={wished ? `Remove ${rec.title} from the wishlist` : `Add ${rec.title} to the wishlist`}
            aria-pressed={wished}
            onClick={() => toggleWishlist({ key, isbn, title, author, coverUrl, ageBand, why, score }, !wished)}
          >
            <BookmarkIcon filled={wished} />
          </button>
        </div>
      </div>
    </article>
  );
}
