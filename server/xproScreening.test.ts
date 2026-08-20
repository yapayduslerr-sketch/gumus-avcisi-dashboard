import { describe, expect, it } from "vitest";
import { createXProDemoSnapshot } from "./xproMockProvider";
import { scoreXProObservation } from "../shared/xproScoring";
import { explainXProScreening } from "../shared/xproScreening";

describe("X Pro eleme ve neden seçilmedi motoru", () => {
  it("skor eşikleri geçilmediğinde kural-temelli elenme gerekçelerini döndürür", () => {
    const observation = createXProDemoSnapshot().observations[0]!;
    const score = scoreXProObservation(observation);
    const decision = explainXProScreening(observation, score, { minimumQualityScore: 100, minimumEarlyScore: 100, maximumRiskScore: 0, minimumRelativeVolume: 5 });
    expect(decision.status).toBe("ELENDİ");
    expect(decision.reasons.length).toBeGreaterThan(2);
    expect(decision.reasons.join(" ")).toContain("Kalite Score");
  });

  it("yetersiz veri varsa aday/elendi iddiası üretmeyip veri eksikliği durumunu kullanır", () => {
    const observation = createXProDemoSnapshot().observations[0]!;
    const shortened = { ...observation, candles: observation.candles.slice(-20) };
    const decision = explainXProScreening(shortened, scoreXProObservation(shortened));
    expect(decision.status).toBe("VERİ_EKSİK");
    expect(decision.reasons.join(" ")).toContain("tarihli");
  });
});
