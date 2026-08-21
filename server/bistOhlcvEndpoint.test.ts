import { describe, expect, it } from "vitest";
import { fetchBistOhlcv } from "../api/bist-ohlcv";

const values = Array.from({ length: 16 }, (_, index) => ({
  datetime: `2026-08-20 ${String(14 + Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}:00`,
  open: "100", high: "102", low: "99", close: String(100 + index / 10), volume: "1000",
}));

describe("BIST 15 dakika OHLCV endpointi", () => {
  it("anahtarı veya ham sağlayıcı gövdesini istemci sonucuna koymadan normalize edilmiş bar döndürür", async () => {
    const result = await fetchBistOhlcv("thyao", { TWELVE_DATA_API_KEY: "secret-key" }, async () => ({ ok: true, status: 200, json: async () => ({ status: "ok", values }) }));
    expect(result).toMatchObject({ state: "READY", data: { symbol: "THYAO", interval: "15min", sourceLabel: expect.stringContaining("BIST XIST") } });
    expect(result.data?.bars).toHaveLength(16);
    expect(JSON.stringify(result)).not.toContain("secret-key");
  });

  it("geçersiz sembolü ağ çağrısı yapmadan reddeder", async () => {
    const result = await fetchBistOhlcv("THYAO/TRY", { TWELVE_DATA_API_KEY: "secret-key" }, async () => { throw new Error("çağrılmamalı"); });
    expect(result.state).toBe("CONFIG_REQUIRED");
    expect(result.data).toBeNull();
  });
});
