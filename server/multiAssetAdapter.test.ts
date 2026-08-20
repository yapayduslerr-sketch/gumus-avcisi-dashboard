import { describe, expect, it, vi } from "vitest";
import { fetchMultiAssetQuotes, getMultiAssetReadiness } from "./multiAssetAdapter";

describe("Twelve Data çoklu-varlık adapteri", () => {
  it("anahtar yokken sağlayıcıya ağ isteği yapmaz", async () => {
    const fetcher = vi.fn();
    await expect(fetchMultiAssetQuotes({}, fetcher)).resolves.toMatchObject({ state: "LICENSE_REQUIRED", quotes: [] });
    expect(fetcher).not.toHaveBeenCalled();
    expect(getMultiAssetReadiness({}).missingEnv).toEqual(["TWELVE_DATA_API_KEY"]);
  });

  it("sağlayıcı yanıtından yalnızca güvenli normalize edilmiş kart alanlarını üretir", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({
      "USD/TRY": { symbol: "USD/TRY", close: "41.10", percent_change: "0.22", timestamp: 1787248000 },
      BRENT: { symbol: "BRENT", close: "69.44", percent_change: "-0.17", timestamp: 1787248000 },
      "XAU/USD": { symbol: "XAU/USD", close: "3350.20", percent_change: "0.35", timestamp: 1787248000 },
      "BTC/USD": { symbol: "BTC/USD", close: "113500", percent_change: "1.20", timestamp: 1787248000 },
    }) });
    const result = await fetchMultiAssetQuotes({ TWELVE_DATA_API_KEY: "secret" }, fetcher);
    expect(result.state).toBe("READY");
    expect(result.quotes).toHaveLength(4);
    expect(result.quotes[0]).toMatchObject({ assetKey: "USD_TRY", sourceLabel: "Twelve Data", price: 41.1, percentChange: 0.22 });
    expect(fetcher.mock.calls[0][0]).toContain("https://api.twelvedata.com/quote?symbol=");
    expect(fetcher.mock.calls[0][1]).toEqual({ headers: { Authorization: "apikey secret" } });
  });
});
