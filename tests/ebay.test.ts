import { describe, expect, it } from "vitest";
import { cheapestUk, ukItemUrl } from "@/lib/ebay";
import { shopLinks } from "@/lib/recommend";

const gbp = (value: string) => ({ value, currency: "GBP" });

describe("cheapestUk", () => {
  it("skips overseas sellers even when their item price is lowest", () => {
    const pick = cheapestUk([
      { price: gbp("1.50"), itemLocation: { country: "US" }, itemWebUrl: "https://www.ebay.com/itm/1", shippingOptions: [{ shippingCost: gbp("14.00") }] },
      { price: gbp("3.00"), itemLocation: { country: "GB" }, itemWebUrl: "https://www.ebay.co.uk/itm/2", shippingOptions: [{ shippingCost: gbp("2.70") }] },
    ]);
    expect(pick).toEqual({ total: gbp("5.70"), price: gbp("3.00"), url: "https://www.ebay.co.uk/itm/2" });
  });
  it("counts postage when choosing the cheapest", () => {
    const pick = cheapestUk([
      { price: gbp("2.00"), itemLocation: { country: "GB" }, itemWebUrl: "https://www.ebay.co.uk/itm/a", shippingOptions: [{ shippingCost: gbp("5.00") }] },
      { price: gbp("4.00"), itemLocation: { country: "GB" }, itemWebUrl: "https://www.ebay.co.uk/itm/b", shippingOptions: [{ shippingCost: gbp("0.00") }] },
    ]);
    expect(pick?.url).toBe("https://www.ebay.co.uk/itm/b");
    expect(pick?.total).toEqual(gbp("4.00"));
  });
  it("ignores prices in other currencies", () => {
    expect(cheapestUk([{ price: { value: "1.00", currency: "USD" }, itemLocation: { country: "GB" } }])).toBeNull();
  });
  it("returns null when nothing qualifies", () => {
    expect(cheapestUk([])).toBeNull();
  });
});

describe("ukItemUrl", () => {
  it("sends item links to ebay.co.uk", () => {
    expect(ukItemUrl("https://www.ebay.com/itm/123456?hash=x")).toBe("https://www.ebay.co.uk/itm/123456?hash=x");
  });
  it("leaves other links alone", () => {
    expect(ukItemUrl("https://example.com/itm/1")).toBe("https://example.com/itm/1");
    expect(ukItemUrl(undefined)).toBeNull();
  });
});

it("the fallback eBay search is UK sellers only, cheapest delivered first", () => {
  const { ebay } = shopLinks({ isbn: "9780143117162", title: "x", author: "y" });
  expect(ebay).toContain("ebay.co.uk");
  expect(ebay).toContain("LH_PrefLoc=1");
  expect(ebay).toContain("_sop=15");
});
