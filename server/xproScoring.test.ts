import { describe, expect, it } from "vitest";
import { createXProDemoSnapshot } from "./xproMockProvider";
import { scoreXProObservation } from "../shared/xproScoring";

describe("X Pro skor motoru", () => {
  it("kalite, erken aday ve riski ayrı skorlar olarak üretir", () => {
    const observation = createXProDemoSnapshot().observations[0]!;
    const profile = scoreXProObservation(observation);
    expect(profile.qualityScore).toBeTypeOf("number");
    expect(profile.earlyScore).toBeTypeOf("number");
    expect(profile.riskScore).toBeTypeOf("number");
    expect(profile.qualityFactors).toHaveLength(8);
    expect(profile.earlyFactors.length).toBeGreaterThan(4);
  });

  it("erken aday kararında kalite ve erken skor eşiğini birlikte zorunlu tutar", () => {
    const observation = createXProDemoSnapshot().observations[0]!;
    const profile = scoreXProObservation(observation);
    expect(profile.isEarlyCandidate).toBe(profile.qualityScore! >= 70 && profile.earlyScore! >= 70 && profile.riskScore! < 60);
  });

  it("yetersiz tarihçede sonuç üretmeyip veri eksiğini açıklar", () => {
    const observation = createXProDemoSnapshot().observations[0]!;
    const profile = scoreXProObservation({ ...observation, candles: observation.candles.slice(-30) });
    expect(profile.qualityScore).toBeNull();
    expect(profile.riskLevel).toBe("VERİ EKSİK");
    expect(profile.blockers[0]).toContain("200");
  });
});
