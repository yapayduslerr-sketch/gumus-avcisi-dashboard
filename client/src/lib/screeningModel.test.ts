import { describe, expect, it } from "vitest";
import { researchPublicationState, totalQualityWeight } from "./screeningModel";

describe("100 puan tarama modeli", () => {
  it("alt ağırlıkları tam 100 puana toplar", () => {
    expect(totalQualityWeight()).toBe(100);
  });

  it("tarihsiz veya kaynaksız çalışma notlarını yayımlanabilir sonuç saymaz", () => {
    expect(researchPublicationState({ sourceUrl: "https://kap.org.tr", financialPeriod: "2026-Q2" })).toBe("Tarih teyidi gerekli");
    expect(researchPublicationState({ asOfDate: "2026-08-20", financialPeriod: "2026-Q2" })).toBe("Kaynak teyidi gerekli");
    expect(researchPublicationState({ asOfDate: "2026-08-20", financialPeriod: "2026-Q2", sourceUrl: "https://kap.org.tr" })).toBe("Yayımlanabilir");
  });
});
