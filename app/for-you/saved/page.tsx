"use client";

import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Gate } from "@/components/Gate";
import { BackIcon } from "@/components/Icons";
import { RecCard } from "@/components/RecCard";
import { toggleWishlist, useWishlist, wishId } from "@/lib/books";

export default function SavedPage() {
  return <Gate>{() => <Saved />}</Gate>;
}

function Saved() {
  const { items, loading } = useWishlist();

  return (
    <>
      <header className="lib-header">
        <Link href="/for-you" className="text-btn light back-link"><BackIcon />For you</Link>
        <h1 className="lib-title">Saved books</h1>
        <p className="lib-sub tucked">
          {loading ? "Opening the list…" : items.length ? "Books to look out for. They drop off the list once you scan them." : ""}
        </p>
      </header>

      <main className="rec-list">
        {!loading && items.length === 0 ? (
          <p className="section-sub">Nothing saved yet. Tap the bookmark on a suggestion to keep it here.</p>
        ) : (
          items.map((r) => <RecCard key={wishId(r)} rec={r} wished onWish={(on) => toggleWishlist(r, on)} />)
        )}
      </main>

      <BottomNav active="foryou" />
    </>
  );
}
