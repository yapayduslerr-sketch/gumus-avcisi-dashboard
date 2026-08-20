import { describe, expect, it } from "vitest";
import { defaultAlertPreferences, removeWatchlistItem, upsertWatchlistItem } from "./personalResearch";

describe("kişisel araştırma alanı", () => {
  it("aynı sembolü çoğaltmadan notunu günceller", () => {
    const first = upsertWatchlistItem([], "fonet", "İlk not");
    const updated = upsertWatchlistItem(first, "FONET", "Güncel not");
    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ symbol: "FONET", note: "Güncel not" });
  });

  it("izleme listesinden seçili sembolü çıkarır ve varsayılan bildirimleri saklar", () => {
    const next = removeWatchlistItem([{ symbol: "INDES", note: "", updatedAt: "2026-08-20" }], "INDES");
    expect(next).toEqual([]);
    expect(defaultAlertPreferences).toEqual({ sourceStatusChanges: false, verifiedCatalysts: false, inAppEnabled: true });
  });
});
