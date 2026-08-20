import { describe, expect, it } from "vitest";
import { createXProFavorite, readXProFavorites, toggleXProFavorite, writeXProFavorites } from "./xproFavorites";

const candidate = { symbol: "DEMO-ALFA", dataMode: "DEMO" as const, price: 42, volume: 1_000, scores: { qualityScore: 70, earlyScore: 55, riskScore: 30 } };

describe("X Pro cihaz favorileri", () => {
  it("ilk eklemede skor/fiyat/hacim için bir başlangıç anı saklar", () => {
    expect(createXProFavorite(candidate, "2026-01-01T00:00:00.000Z")).toMatchObject({ symbol: "DEMO-ALFA", baseline: { qualityScore: 70, price: 42, volume: 1_000 } });
  });

  it("aynı sembol ikinci kez seçildiğinde kaydı çıkarır", () => {
    const added = toggleXProFavorite([], candidate, "2026-01-01T00:00:00.000Z");
    expect(toggleXProFavorite(added, candidate)).toEqual([]);
  });

  it("bozuk cihaz verisinde boş favori listesine güvenli döner", () => {
    expect(readXProFavorites({ getItem: () => "bozuk-json" })).toEqual([]);
  });

  it("favori listesini açık saklama anahtarıyla yazıp geri okur", () => {
    let value: string | null = null;
    const storage = { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } };
    const favorites = toggleXProFavorite([], candidate, "2026-01-01T00:00:00.000Z");
    writeXProFavorites(favorites, storage);
    expect(readXProFavorites(storage)).toHaveLength(1);
  });
});
