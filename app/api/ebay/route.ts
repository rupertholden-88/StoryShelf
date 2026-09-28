import { NextResponse, type NextRequest } from "next/server";

// eBay Browse API, UK marketplace. Keys stay on the server (Vercel env vars).
let token: { value: string; expires: number } | null = null;

async function getToken(): Promise<string | null> {
  if (token && token.expires > Date.now() + 60_000) return token.value;
  const id = process.env.EBAY_CLIENT_ID;
  const secret = process.env.EBAY_CLIENT_SECRET;
  if (!id || !secret) return null;
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("https://api.ebay.com/oauth/api_scope"),
  });
  if (!res.ok) throw new Error(`eBay token ${res.status}`);
  const j = await res.json();
  token = { value: j.access_token, expires: Date.now() + j.expires_in * 1000 };
  return token.value;
}

type Summary = { price?: { value: string; currency: string }; itemWebUrl?: string };

async function searchEbay(t: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ limit: "20", sort: "price", filter: "deliveryCountry:GB", ...params });
  const res = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${qs}`, {
    headers: { Authorization: `Bearer ${t}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB" },
  });
  if (!res.ok) throw new Error(`eBay search ${res.status}`);
  const j = await res.json();
  return { items: (j.itemSummaries ?? []) as Summary[], total: (j.total ?? 0) as number };
}

export async function GET(req: NextRequest) {
  const isbn = req.nextUrl.searchParams.get("isbn");
  const q = req.nextUrl.searchParams.get("q");
  if (!isbn && !q) return NextResponse.json({ error: "isbn or q required" }, { status: 400 });

  try {
    const t = await getToken();
    if (!t) return NextResponse.json({ error: "not-configured" }, { status: 501 });

    let result = isbn ? await searchEbay(t, { gtin: isbn }) : { items: [], total: 0 };
    if (result.items.length === 0 && q) result = await searchEbay(t, { q, category_ids: "267" });

    const priced = result.items.filter((i) => i.price?.value);
    priced.sort((a, b) => Number(a.price!.value) - Number(b.price!.value));
    const cheapest = priced[0];

    return NextResponse.json(
      { count: result.total, lowest: cheapest?.price ?? null, url: cheapest?.itemWebUrl ?? null },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch {
    return NextResponse.json({ error: "ebay-unavailable" }, { status: 502 });
  }
}
