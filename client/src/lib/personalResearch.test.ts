import { describe, expect, it } from "vitest";
import { createPersonalResearchBackup, defaultAlertPreferences, parsePersonalResearchBackup, removeWatchlistItem, upsertWatchlistItem } from "./personalResearch";

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

  it("taşınabilir yedeği doğrular ve geçersiz dosyayı reddeder", () => {
    const backup = createPersonalResearchBackup([{ symbol: "INDES", note: "Dönem kontrolü", updatedAt: "2026-08-20" }], defaultAlertPreferences);
    expect(parsePersonalResearchBackup(JSON.stringify(backup))).toMatchObject({ version: 1, watchlist: [{ symbol: "INDES" }] });
    expect(() => parsePersonalResearchBackup('{"version":1,"watchlist":[{}]}')).toThrow("yedek formatında değil");
  });
});
