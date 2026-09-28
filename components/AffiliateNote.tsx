/** Shown wherever there are Amazon links, but only if they carry an Associates tag. */
export function AffiliateNote() {
  if (!process.env.NEXT_PUBLIC_AMAZON_TAG) return null;
  return (
    <p className="affiliate-note">
      Amazon links include our Amazon Associates tag, so we may earn a small commission if you buy. It doesn't change the price.
    </p>
  );
}
