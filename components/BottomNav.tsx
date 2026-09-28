import Link from "next/link";
import { BarcodeIcon, BookmarkIcon, ShelfIcon } from "./Icons";

export function BottomNav({ active }: { active: "library" | "foryou" }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <Link href="/" className="nav-item" aria-current={active === "library" ? "page" : undefined}>
        <ShelfIcon />
        Library
      </Link>
      <Link href="/scan" className="scan-btn">
        <BarcodeIcon />
        Scan a book
      </Link>
      <Link href="/for-you" className="nav-item" aria-current={active === "foryou" ? "page" : undefined}>
        <BookmarkIcon />
        For you
      </Link>
    </nav>
  );
}
