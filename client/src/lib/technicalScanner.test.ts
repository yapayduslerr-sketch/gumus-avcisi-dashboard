import { describe, expect, it } from "vitest";
import { buildChartOverlays, evaluateTechnicalModel, summarizeModelIntersection, type OhlcvBar, type TechnicalDataSet } from "./technicalScanner";

function bars(count: number, multiplier = 1): OhlcvBar[] {
  return Array.from({ length: count }, (_, index) => {
    const close = (100 + index * multiplier);
    return { timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(), open: close - 0.5, high: close + 1, low: close - 1, close, volume: 1_000 + index };
  });
}

function dataSet(data: OhlcvBar[]): TechnicalDataSet {
  return { symbol: "TEST", bars: data, asOf: "2026-08-20T12:00:00.000Z", sourceLabel: "Test kaynağı", sourceUrl: "https://example.test/ohlcv", delayMinutes: 15 };
}

describe("teknik tarama çekirdeği", () => {
  it("kaynak URL’si veya gözlem zamanı geçerli olmayan veride sinyal üretmez", () => {
    const finding = evaluateTechnicalModel({ ...dataSet(bars(30)), sourceUrl: "" }, "rsi-momentum");
    expect(finding.state).toBe("INVALID_SOURCE");
    expect(finding.matched).toBe(false);
  });

  it("yetersiz OHLCV geçmişini açıkça işaretler", () => {
    const finding = evaluateTechnicalModel(dataSet(bars(40)), "golden-cross");
    expect(finding.state).toBe("INSUFFICIENT_DATA");
    expect(finding.matched).toBe(false);
  });

  it("en az 20 gün öncesindeki hacim ortalamasına göre hacim eşiğini hesaplar", () => {
    const series = bars(25);
    series[24] = { ...series[24], volume: 5_000 };
    const finding = evaluateTechnicalModel(dataSet(series), "volume-breakout");
    expect(finding.state).toBe("MATCH");
    expect(finding.evidence.volumeMultiple20).toBeGreaterThanOrEqual(2);
  });

  it("52 hafta bağlamını yalnızca yeterli bar sayısı olduğunda değerlendirebilir", () => {
    const finding = evaluateTechnicalModel(dataSet(bars(252)), "fifty-two-week-breakout");
    expect(finding.state).toBe("MATCH");
    expect(finding.evidence.high52w).not.toBeNull();
  });

  it("trend rejimini ve model kesişim sayısını ayrı, kaynaklanabilir çıktılar olarak hesaplar", () => {
    const data = dataSet(bars(252));
    const trend = evaluateTechnicalModel(data, "trend-regime");
    const breakout = evaluateTechnicalModel(data, "fifty-two-week-breakout");
    expect(trend.state).toBe("MATCH");
    expect(summarizeModelIntersection([trend, breakout])).toMatchObject({ eligibleModelCount: 2, matchedModelCount: 2, state: "MULTI_MODEL_MATCH" });
  });

  it("grafik katmanlarını yalnızca mevcut OHLCV kapanışlarından üretir", () => {
    const overlays = buildChartOverlays(bars(50));
    expect(overlays).toHaveLength(50);
    expect(overlays[8]?.sma10).toBeNull();
    expect(overlays[9]?.sma10).toBe(104.5);
    expect(overlays[19]?.sma20).toBe(109.5);
    expect(overlays[49]?.sma50).toBe(124.5);
  });
});
