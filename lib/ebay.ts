// Picking the listing to show from eBay Browse API results. Kept separate from the route so it can be tested.

type Money = { value: string; currency: string };
export type EbaySummary = {
  price?: Money;
  itemWebUrl?: string;
  itemLocation?: { country?: string };
  shippingOptions?: { shippingCost?: Money }[];
};

/** Postage for a listing; unknown postage counts as free so the listing isn't hidden. */
function postage(i: EbaySummary): number {
  const costs = (i.shippingOptions ?? []).map((o) => Number(o.shippingCost?.value)).filter((n) => Number.isFinite(n));
  return costs.length ? Math.min(...costs) : 0;
}

/** Item pages on the UK site, whichever eBay domain the API happened to link to. */
export function ukItemUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (/(^|\.)ebay\.[a-z.]+$/.test(u.hostname) && u.pathname.startsWith("/itm/")) u.hostname = "www.ebay.co.uk";
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * The cheapest listing located in the UK and priced in pounds, counting postage.
 * Filtering on "delivers to the UK" alone let in US sellers whose low item price hid high postage.
 */
export function cheapestUk(items: EbaySummary[]): { total: Money; price: Money; url: string | null } | null {
  let best: { total: Money; price: Money; url: string | null } | null = null;
  let bestTotal = Infinity;
  for (const i of items) {
    if (i.itemLocation?.country && i.itemLocation.country !== "GB") continue;
    if (!i.price?.value || i.price.currency !== "GBP") continue;
    const total = Number(i.price.value) + postage(i);
    if (!Number.isFinite(total) || total >= bestTotal) continue;
    bestTotal = total;
    best = { total: { value: total.toFixed(2), currency: "GBP" }, price: i.price, url: ukItemUrl(i.itemWebUrl) };
  }
  return best;
}
